import { Request, Response } from "express";

import { UserRepository } from "../repository/user/user.repository";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { stripeHelper } from "../helpers/stripe.helper";
import { IUser } from "../../database/interfaces/user.interface";
import { DateHelper } from "../helpers/date.helper";
import { APPLICATION_FEE } from "../../constant";
import Stripe from "stripe";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { TransactionRepository } from "../repository/transaction/transaction.repository";
import { ITransaction } from "../../database/interfaces/transaction.interface";
import {
  ETransactionStatus,
  TransactionType,
} from "../../database/interfaces/enums";
import {
  IWallet,
  PaymentIntentType,
} from "../../database/interfaces/wallet.interface";
import mongoose from "mongoose";

class StripeService {
  private userRepository: UserRepository;
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private dateHelper: DateHelper;

  constructor() {
    this.userRepository = new UserRepository();
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
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

      const originalAmountInCents = paymentIntent.amount_received; // Get actual amount received from Stripe

      // Calculate Stripe fees and net transfer amount
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
        this.transactionRepository.create(
          {
            amount: profitInDollars,
            user: req.locals.auth?.userId as string,
            type: TransactionType.applicationFee,
            wallet: updatedWallet?._id as string,
            status: ETransactionStatus.pending,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ITransaction,
          { session }
        ),
        this.transactionRepository.create(
          {
            amount: finalAmountToAddInDollars,
            user: req.locals.auth?.userId as string,
            type: TransactionType.topUp,
            wallet: updatedWallet?._id as string,
            status: ETransactionStatus.completed,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ITransaction,
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
      await session.abortTransaction();
      session.endSession();
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async webhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    let event;
    try {
      event = stripeHelper.stripeWebHook(req.body, sig as string);
    } catch (err) {
      console.error("Webhook Error:", (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // Handle the event
    switch (event.type) {
      case "charge.succeeded":
        console.log("Charge succeeded:", event.data.object);
        // Handle the charge.succeeded event
        break;
      case "customer.subscription.pending_update_expired":
        console.log("Subscription pending update expired:", event.data.object);
        // Handle the customer.subscription.pending_update_expired event
        break;

      case "account.application.authorized":
        console.log("Account application authorized:", event.data.object);

        break;
      case "account.updated":
        const account = event.data.object as Stripe.Account;
        console.log("Account Updated:", account);
        // Safely check if the account is fully activated
        if (
          account.details_submitted &&
          account.charges_enabled &&
          account.payouts_enabled
        ) {
          this.userRepository.updateByOne(
            { stripeConnectId: account.id },
            { accountAuthorized: true }
          );
          // Handle successful account activation
          // e.g., notify the user, update your database, etc.
        } else if (
          account.requirements &&
          account.requirements.currently_due &&
          account?.requirements?.currently_due.length > 0
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
          // Handle incomplete account setup
          // e.g., notify the user to provide the missing details
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
          // Handle account failure due to unmet requirements
          // e.g., notify the user about the issue, suggest corrective actions
        } else {
          console.log(`Account ${account.id} is not fully active yet.`);
          this.userRepository.updateByOne(
            { stripeConnectId: account.id },
            { accountAuthorized: false }
          );
          // Handle other statuses
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Respond to acknowledge receipt of the event
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

  payout = async (req: Request): Promise<ApiResponse> => {
    try {
      const connect = await this.getConnect(req.locals.auth?.userId as string);

      const balance = await stripeHelper.retrieveBalance();
      console.log("~ balance", balance);

      const wallet = await this.walletRepository.getOne<IWallet>({
        user: req.locals.auth?.userId as string,
      });

      if (!wallet) return ResponseHelper.sendResponse(400, "Wallet not found");

      if (wallet?.balance < req.body.amount) {
        return ResponseHelper.sendResponse(400, "Balance is low");
      }

      // const transfer = await stripeHelper.transfer({
      //   amount: req.body.amount * 100,
      //   destination: connect.data.id,
      //   currency: "usd",
      // });
      // console.log("transaction", transfer);

      if (connect.status) {
        const withdraw = await stripeHelper.payout(connect.data.id, {
          method: "standard", //req.params.source.includes("card") ? "instant" : "standard"
          currency: (connect.data as Stripe.Account).default_currency,
          amount: req.body.amount * 100,
          destination: req.params.source,
        } as Stripe.PayoutCreateParams);

        if (withdraw === false)
          return ResponseHelper.sendResponse(400, "Withdrawal failed");
        else if (withdraw.id) {
          const wallet = await this.walletRepository.updateBalance(
            req.locals.auth?.userId as string,
            -req.body.amount
          );
          this.transactionRepository.create({
            amount: withdraw.amount / 100,
            user: req.locals.auth?.userId as string,
            type: TransactionType.withdraw,
            wallet: wallet?._id,
          } as ITransaction);
          return ResponseHelper.sendSuccessResponse(
            "Withdrawal successful",
            withdraw
          );
        }
        throw withdraw;
      }
      throw connect;
    } catch (error) {
      // console.log(error);
      // console.log(error);
      return ResponseHelper.sendResponse(
        400,
        (error as any)?.code === "parameter_invalid_integer"
          ? "Balance is low"
          : (error as Error).message
      );
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

      // Check if the user already has a Stripe Connect account
      let stripeConnectId = user.stripeConnectId;

      // If the user doesn't have a Stripe Connect account, create one
      if (!stripeConnectId) {
        const createStripeConnect = await stripeHelper.stripeConnectAccount({
          email: user.email,
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

      // Generate the account onboarding link
      const accountLink = await stripeHelper.connectAccountOnboardingLink(
        stripeConnectId
      );

      if (!accountLink) {
        return ResponseHelper.sendResponse(400, "Account link not created");
      }

      // Return the account link in the response
      return ResponseHelper.sendSuccessResponse(
        "Account link created",
        accountLink
      );
    } catch (error) {
      // Handle any errors that occur during the process
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
      const wallet = await this.walletRepository.getOne<IWallet>({
        user: req.locals.auth?.userId as string,
      });

      if (!wallet) return ResponseHelper.sendResponse(400, "Wallet not found");
      if (wallet.balance < req.body.amount)
        return ResponseHelper.sendResponse(400, "Insufficient balance");

      this.transactionRepository.create(
        {
          amount: req.body.amount,
          user: req.locals.auth?.userId as string,
          type: TransactionType.withdraw,
          status: ETransactionStatus.pending,
        } as ITransaction,
        { session }
      );

      await this.walletRepository.updateById(
        wallet._id as string,
        { balance: wallet.balance - req.body.amount },
        { session }
      );
      session.commitTransaction();
      return ResponseHelper.sendSuccessResponse("Withdrawal request sent", {});
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

      const transaction =
        await this.transactionRepository.getById<ITransaction>(
          req.params.id,
          "",
          "",
          [],
          true
        );

      if (!transaction)
        return ResponseHelper.sendResponse(404, "transaction not found");

      switch (status) {
        case ETransactionStatus.cancelled:
          {
            const wallet = await this.walletRepository.updateByOne(
              { user: transaction.user as string },
              { $inc: { balance: +transaction.amount } },
              { session }
            );
            if (!wallet) {
              session.abortTransaction();
              return ResponseHelper.sendResponse(400, "Wallet not found");
            }
          }
          break;

        case ETransactionStatus.completed: {
          const user = await this.userRepository.getById<IUser>(
            transaction.user as string
          );
          if (!user) {
            session.abortTransaction();
            return ResponseHelper.sendResponse(404, "User not found");
          }

          const payout = stripeHelper.payout(user.stripeConnectId as string, {
            amount: transaction.amount * 100,
            currency: "usd",
            destination: user.stripeConnectId as string,
          });
          if (!payout) {
            session.abortTransaction();
            return ResponseHelper.sendResponse(400, "Payout failed");
          }
        }
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
}

export default StripeService;
