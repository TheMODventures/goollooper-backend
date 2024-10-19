import { Request, Response } from "express";

import { UserRepository } from "../repository/user/user.repository";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { stripeHelper } from "../helpers/stripe.helper";
import { IUser } from "../../database/interfaces/user.interface";
import { DateHelper } from "../helpers/date.helper";
import { APPLICATION_FEE } from "../../constant";
import { Stripe } from "stripe";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { TransactionRepository } from "../repository/transaction/transaction.repository";
import {
  ITransaction,
  ITransactionDoc,
} from "../../database/interfaces/transaction.interface";
import {
  BANK_ACCOUNT_PAYMENT_METHOD_TYPE,
  BANK_ACCOUNT_STATUS,
  ETransactionStatus,
  EUserRole,
  PAYOUT_SOURCE,
  TransactionType,
} from "../../database/interfaces/enums";
import { IWallet } from "../../database/interfaces/wallet.interface";
import mongoose from "mongoose";
import TokenService from "./token.service";
import { NotificationRepository } from "../repository/notification/notification.repository";
import { INotification } from "../../database/interfaces/notification.interface";

class StripeService {
  private userRepository: UserRepository;
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private tokenService: TokenService;
  private notificationRepository: NotificationRepository;
  private dateHelper: DateHelper;

  constructor() {
    this.userRepository = new UserRepository();
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.tokenService = new TokenService();
    this.notificationRepository = new NotificationRepository();
    this.dateHelper = new DateHelper();
  }

  async createWallet(email: string, dataset: Stripe.AccountCreateParams) {
    try {
      let stripeCustomer;
      const stripeConnect = await stripeHelper.createConnect(email, dataset);
      if (stripeConnect.id)
        stripeCustomer = await stripeHelper.createStripeCustomer(email);
      return ResponseHelper.sendSuccessResponse(
        "stripe accounts created successfully",
        { stripeConnect, stripeCustomer }
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async getConnect(id: string) {
    const user: IUser | null = await this.userRepository.getById(
      id,
      undefined,
      "stripeConnectId"
    );
    if (!user) return ResponseHelper.sendResponse(404, "User not found");
    const connect = await stripeHelper.getConnect(
      user.stripeConnectId as string
    );
    if (!connect)
      return ResponseHelper.sendResponse(404, "Connect account not found");
    return ResponseHelper.sendSuccessResponse("Connect account found", connect);
  }

  async createPaymentIntent(req: Request): Promise<ApiResponse> {
    const { amount } = req.body;
    const userId = req.locals.auth?.userId;

    if (!userId) {
      return ResponseHelper.sendResponse(400, "User not authenticated");
    }

    // Convert amount to cents
    const amountInCents = amount * 100;

    try {
      // Fetch user from repository
      const user: IUser | null = await this.userRepository.getById(
        userId,
        undefined,
        "stripeCustomerId stripeConnectId"
      );

      if (!user?.stripeCustomerId) {
        return ResponseHelper.sendResponse(
          400,
          "Stripe Connect Account not found"
        );
      }
      // Create payment intent
      const paymentIntent = await stripeHelper.createPaymentIntent({
        currency: "usd",
        confirmation_method: "manual",
        amount: amountInCents,
        payment_method_types: ["card"],
        customer: user.stripeCustomerId,
      });

      return ResponseHelper.sendSuccessResponse(
        "Payment intent created successfully",
        paymentIntent
      );
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async confirmPayment(req: Request): Promise<ApiResponse> {
    const { paymentIntentId, paymentMethod } = req.body;
    const session = await mongoose.startSession();

    try {
      // Start a transaction
      session.startTransaction();

      // Fetch payment intent
      const paymentIntent = await stripeHelper.confirmPaymentIntent(
        paymentIntentId, // Pass the payment intent ID separately
        {
          payment_method: paymentMethod,
        }
      );

      if (paymentIntent.status !== "succeeded") {
        await session.abortTransaction();
        session.endSession();
        return ResponseHelper.sendResponse(400, "Payment intent not confirmed");
      }

      const originalAmountInCents = paymentIntent.amount_received;

      const stripeFeeInCents = this.dateHelper.calculateStripeFee(
        originalAmountInCents
      );
      const applicationFeeInCents = Math.round(APPLICATION_FEE * 100);
      const netTransferAmountInCents =
        originalAmountInCents - stripeFeeInCents - applicationFeeInCents;

      // Calculate profit
      const profitInCents = this.dateHelper.calculateProfit(
        originalAmountInCents,
        netTransferAmountInCents
      );

      // Calculate the final amount to add to the wallet
      const finalAmountToAddInCents = netTransferAmountInCents - profitInCents;
      const finalAmountToAddInDollars = finalAmountToAddInCents / 100;
      const profitInDollars = profitInCents / 100;

      // Perform wallet update and transaction creation in parallel
      const updatedWallet = await this.walletRepository.updateByOne<IWallet>(
        { user: req.locals.auth?.userId as string },
        { $inc: { balance: finalAmountToAddInDollars } }, // $inc should be at the top level
        { session }
      );

      if (!updatedWallet) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHelper.sendResponse(500, "Wallet update failed");
      }

      const [topUpTransaction, applicationFeeTransaction] = await Promise.all([
        this.transactionRepository.create<ITransactionDoc>(
          {
            amount: profitInDollars,
            user: req.locals.auth?.userId as string,
            type: TransactionType.applicationFee,
            wallet: updatedWallet?._id as string,
            status: ETransactionStatus.pending,
            isCredit: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { session }
        ),
        this.transactionRepository.create<ITransactionDoc>(
          {
            amount: finalAmountToAddInDollars,
            user: req.locals.auth?.userId as string,
            type: TransactionType.topUp,
            wallet: updatedWallet?._id as string,
            status: ETransactionStatus.completed,
            isCredit: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { session }
        ),
      ]);

      if (!topUpTransaction || !applicationFeeTransaction) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHelper.sendResponse(500, "Transaction creation failed");
      }
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return ResponseHelper.sendSuccessResponse(
        "Payment intent confirmed successfully",
        paymentIntent
      );
    } catch (error) {
      // Abort transaction in case of error
      console.log("PAYMENT INTENT ERROR", error);

      if (error instanceof Error) {
        if (error instanceof Stripe.errors.StripeCardError) {
          console.log(`A payment error occurred: ${error.message}`);
          return ResponseHelper.sendResponse(400, "Card Decline");
        } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
          console.log("An invalid request occurred:", error.message);
          return ResponseHelper.sendResponse(
            400,
            "An invalid request occurred"
          );
        } else if (error instanceof Stripe.errors.StripeAPIError) {
          console.log("A Stripe API error occurred:", error.message);
          return ResponseHelper.sendResponse(
            500,
            "An error occurred with the Stripe API."
          );
        } else {
          console.log(
            "Another problem occurred, maybe unrelated to Stripe:",
            error.message
          );
        }
      } else {
        console.log("Unknown error type:", error);
      }

      await session.abortTransaction();
      session.endSession();
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }
  async webhookConnectAccount(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    let event;
    try {
      event = stripeHelper.stripeWebHookConnectAccount(req.body, sig as string);
    } catch (err) {
      console.error("Webhook Error:", (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    switch (event.type) {
      case "account.updated":
        const account = event.data.object as Stripe.Account;
        console.log("Account Updated:", account);

        if (
          account.details_submitted &&
          account.charges_enabled &&
          account.payouts_enabled
        ) {
          this.userRepository.updateByOne<IUser>(
            { stripeConnectId: account.id },
            {
              accountAuthorized: true,
              stripeConnectAccountRequirementsDue: {
                payoutEnabled: true,
                chargesEnabled: true,
                disabledReason: "",
              },
            } as IUser
          );
          console.log(`Account ${account.id} has been fully activated.`);
        } else if (
          account.requirements &&
          account.requirements.currently_due &&
          account.requirements.currently_due.length > 0
        ) {
          console.log(
            `Account ${account.id} has missing information:`,
            account.requirements.currently_due
          );
          this.userRepository.updateByOne(
            { stripeConnectId: account.id },
            {
              stripeConnectAccountRequirementsDue: {
                currentlyDue: account.requirements.currently_due,
              },
              accountAuthorized: false,
            }
          );
        } else if (account.requirements?.disabled_reason) {
          console.log(
            `Account ${account.id} is disabled due to: ${account.requirements.disabled_reason}`
          );
          this.userRepository.updateByOne(
            { stripeConnectId: account.id },
            {
              stripeConnectAccountRequirementsDue: {
                disabledReason: account.requirements.disabled_reason,
              },
              accountAuthorized: false,
            }
          );
        } else if (
          account.payouts_enabled === false ||
          account.charges_enabled === false
        ) {
          console.log(`Account ${account.id} is not fully active yet.`);
          this.userRepository.updateByOne(
            { stripeConnectId: account.id },
            {
              accountAuthorized: false,
              stripeConnectAccountRequirementsDue: {
                payoutEnabled: account.payouts_enabled,
                chargesEnabled: account.charges_enabled,
              },
            }
          );
        } else {
          console.log(`Account ${account.id} is not fully active yet.`);
          this.userRepository.updateByOne(
            { stripeConnectId: account.id },
            { accountAuthorized: false }
          );
        }
        break;
      case "payout.canceled":
        const cancelPayout = event.data.object;
        console.log("PAYOUT CANCELED ->", cancelPayout);
        break;
      case "payout.failed":
        const failedPayout = event.data.object;
        const wallet = failedPayout.metadata && failedPayout.metadata.wallet;
        const id = failedPayout.metadata && failedPayout.metadata.transfer_id;

        const amount = failedPayout.amount / 100;

        if (!wallet) break;
        const updateBalance = await this.walletRepository.updateById<IWallet>(
          wallet,
          { $inc: { balance: amount } }
        );
        const reverseTransfer = await stripeHelper.reverseTransfer(id!);
        console.log("WALLET UPDATED -> ", updateBalance);
        console.log("REVERSE TRANSFER ->", reverseTransfer);

        break;
      case "radar.early_fraud_warning.created":
        const radar = event.data.object;
        console.log("RADAR WARNING CREATED ->", radar);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }
    res.status(200).json({ received: true });
    return;
  }

  async webhookSubscription(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    let event;
    try {
      event = stripeHelper.stripeWebHookSubscription(req.body, sig as string);
    } catch (err) {
      console.error("Webhook Error:", (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.deleted":
        console.log("Subscription deleted:", event.data.object);

        const customer = event.data.object.customer as string;
        const user = await this.userRepository.getOne<IUser>({
          stripeCustomerId: customer,
        });

        if (user) {
          await this.tokenService.loggedOut(
            user._id as string,
            user?.refreshToken as string
          );

          await this.userRepository.updateByOne<IUser>(
            { stripeCustomerId: customer },
            {
              role: EUserRole.user,
              subscription: {
                subscribe: false,
              },
            }
          );
        }

        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
    return;
  }

  async getStripeCustomer(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      if (!user.stripeCustomerId)
        return ResponseHelper.sendResponse(404, "Stripe customer id not found");
      const customer = await stripeHelper.getStripeCustomer(
        user.stripeCustomerId as string
      );
      if (!customer)
        return ResponseHelper.sendResponse(404, "Customer not found");
      return ResponseHelper.sendSuccessResponse("Customer retreived", customer);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  platformPayout = async (req: Request): Promise<ApiResponse> => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { amount } = req.body;
      const retrieveBalance = await stripeHelper.retrieveBalance();

      if (
        retrieveBalance.available.length > 0 &&
        retrieveBalance.available[0].amount < amount * 100
      ) {
        session.abortTransaction();
        return ResponseHelper.sendResponse(400, "Insufficient balance");
      }

      const payout = await stripeHelper.platformPayout({
        amount: amount * 100,
        currency: "usd",
        description: "Payout Goollooper",
      });

      const transaction =
        await this.transactionRepository.updateMany<ITransaction>(
          {
            status: ETransactionStatus.pending,
            type: {
              $in: [
                TransactionType.subscription,
                TransactionType.taskAddRequest,
                TransactionType.megablast,
                TransactionType.applicationFee,
              ],
            },
          },
          {
            $set: { status: ETransactionStatus.completed },
          },
          { session }
        );
      session.commitTransaction();
      return ResponseHelper.sendSuccessResponse("Payout", payout);
    } catch (error) {
      session.abortTransaction();
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  async onboarding(req: Request): Promise<ApiResponse> {
    try {
      // Retrieve the user based on the provided user ID in the request

      const user = await this.userRepository.getById<IUser>(
        req.locals.auth?.userId as string
      );

      if (!user) {
        return ResponseHelper.sendResponse(404, "User not found");
      }

      let stripeConnectId = user.stripeConnectId;

      if (!stripeConnectId) {
        const createStripeConnect = await stripeHelper.stripeConnectAccount({
          email: user.email,
          country: user.countryCode,
        });

        if (!createStripeConnect) {
          return ResponseHelper.sendResponse(
            400,
            "Stripe connect account not created"
          );
        }

        // Save the new Stripe Connect account ID to the user's record
        stripeConnectId = createStripeConnect.id;
        await this.userRepository.updateById(user._id as string, {
          stripeConnectId,
        });
      }
      const payload = { ...req.body, account: stripeConnectId };

      // Generate the account onboarding link
      const accountLink = await stripeHelper.connectAccountOnboardingLink(
        payload
      );

      if (!accountLink) {
        return ResponseHelper.sendResponse(400, "Account link not created");
      }

      return ResponseHelper.sendSuccessResponse(
        "Account link created",
        accountLink
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  stripeBalance = async (req: Request): Promise<ApiResponse> => {
    try {
      const balance = await stripeHelper.retrieveBalance();
      return ResponseHelper.sendSuccessResponse("Balance retrieved", balance);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  withdrawRequest = async (req: Request): Promise<ApiResponse> => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const user = await this.userRepository.getById<IUser>(
        req.locals.auth?.userId as string
      );

      if (!user) return ResponseHelper.sendResponse(404, "User not found");

      if (!user.stripeConnectId)
        return ResponseHelper.sendResponse(
          404,
          "Stripe Connect Account not found"
        );

      if (!user.accountAuthorized)
        return ResponseHelper.sendResponse(400, "Account not authorized");

      const requirements = user.stripeConnectAccountRequirementsDue;

      if (requirements?.currentlyDue?.length > 0) {
        return ResponseHelper.sendResponse(
          400,
          `Account requirements currently due: ${requirements.currentlyDue.join(
            ", "
          )}`
        );
      }

      if (requirements?.pastDue?.length > 0) {
        return ResponseHelper.sendResponse(
          400,
          `Account requirements past due: ${requirements.pastDue.join(", ")}`
        );
      }
      const bankAccount = await stripeHelper.getDefaultBankAccount(
        user.stripeConnectId,
        PAYOUT_SOURCE.bank
      );

      if (Array.isArray(bankAccount.data) && bankAccount.data.length === 0) {
        return ResponseHelper.sendResponse(
          400,
          `You have not attached a bank account for payout. Please add a bank account to proceed.`
        );
      }

      const status = bankAccount.data[0].status;

      if (
        status === BANK_ACCOUNT_STATUS.verification_failed ||
        status === BANK_ACCOUNT_STATUS.errored
      ) {
        return ResponseHelper.sendResponse(
          400,
          `The bank account you attached could not be verified or encountered an error. Please update your bank account details or add a new bank account to proceed with payouts.`
        );
      }

      const wallet = await this.walletRepository.getOne<IWallet>({
        user: req.locals.auth?.userId as string,
      });

      if (!wallet) return ResponseHelper.sendResponse(400, "Wallet not found");
      if (wallet.balance < req.body.amount)
        return ResponseHelper.sendResponse(400, "Insufficient balance");

      const payout = await this.transactionRepository.create<ITransaction>(
        {
          amount: req.body.amount,
          user: req.locals.auth?.userId as string,
          type: TransactionType.withdraw,
          isCredit: false,
          status: ETransactionStatus.pending,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ITransaction,
        { session }
      );

      await this.walletRepository.updateById(
        wallet._id as string,
        { balance: wallet.balance - req.body.amount },
        { session }
      );
      session.commitTransaction();
      return ResponseHelper.sendSuccessResponse(
        "Withdrawal request sent",
        payout
      );
    } catch (error) {
      session.abortTransaction();
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  toggleWithdrawRequest = async (req: Request): Promise<ApiResponse> => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const status = req.body.status;
      const transaction = await this.transactionRepository.getOne<ITransaction>(
        {
          _id: req.params.id,
          status: ETransactionStatus.pending,
        },
        "",
        "",
        [],
        true
      );

      if (!transaction)
        return ResponseHelper.sendResponse(404, "transaction not found");

      const user = await this.userRepository.getById<IUser>(
        transaction.user as string
      );
      if (!user) {
        session.abortTransaction();
        return ResponseHelper.sendResponse(404, "User not found");
      }

      const retrievedBalance = await stripeHelper.retrieveBalance();

      if (
        retrievedBalance?.pending[0].amount < transaction.amount * 100 ||
        retrievedBalance?.available[0].amount < transaction.amount * 100
      ) {
        session.abortTransaction();
        return ResponseHelper.sendResponse(400, "Insufficient balance");
      }

      const bankAccount = await stripeHelper.getDefaultBankAccount(
        user.stripeConnectId,
        PAYOUT_SOURCE.bank
      );

      let isInstantAvailable;

      if (Array.isArray(bankAccount.data) && bankAccount.data.length > 0) {
        isInstantAvailable =
          bankAccount.data[0].available_payout_methods?.includes(
            BANK_ACCOUNT_PAYMENT_METHOD_TYPE.instant
          );
      } else {
        isInstantAvailable = false;
      }

      const transferFunds = await stripeHelper.transfer({
        amount: transaction.amount * 100,
        currency: "usd",
        destination: user.stripeConnectId as string,
      });

      if (!transferFunds) {
        session.abortTransaction();
        return ResponseHelper.sendResponse(400, "Transfer failed");
      }

      const payout = await stripeHelper.payout(user.stripeConnectId as string, {
        amount: transaction.amount * 100,
        currency: "usd",
        method: isInstantAvailable
          ? BANK_ACCOUNT_PAYMENT_METHOD_TYPE.instant
          : BANK_ACCOUNT_PAYMENT_METHOD_TYPE.standard,
        metadata: {
          transfer_id: transferFunds.id,
          wallet: String(user.wallet),
        },
      });

      if (!payout) {
        session.abortTransaction();
        return ResponseHelper.sendResponse(400, "Payout failed");
      }

      const updatedTransaction = await this.transactionRepository.updateById(
        transaction._id as string,
        { status },
        { session }
      );

      if (!updatedTransaction) {
        session.abortTransaction();
        return ResponseHelper.sendResponse(400, "Withdrawal not updated");
      }

      session.commitTransaction();
      return ResponseHelper.sendSuccessResponse(
        "Withdrawal updated successfully",
        updatedTransaction
      );
    } catch (error) {
      session.abortTransaction();
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  goollooperBalance = async (req: Request): Promise<ApiResponse> => {
    try {
      const transactionTypes = [
        TransactionType.subscription,
        TransactionType.taskAddRequest,
        TransactionType.megablast,
        TransactionType.applicationFee,
      ];

      const transactionResponse =
        await this.transactionRepository.getAllWithAggregatePagination<ITransaction>(
          [
            {
              $match: {
                type: { $in: transactionTypes },
                status: ETransactionStatus.pending,
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
              },
            },
          ]
        );

      if (
        !transactionResponse ||
        !transactionResponse.data ||
        transactionResponse.data.length === 0
      ) {
        return ResponseHelper.sendResponse(404, "Transaction not found");
      }

      const balance = transactionResponse.data[0]?.totalAmount || 0;

      return ResponseHelper.sendSuccessResponse("Balance retrieved", balance);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default StripeService;
