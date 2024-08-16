import { Request, Response } from "express";

import { UserRepository } from "../repository/user/user.repository";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { stripeHelper } from "../helpers/stripe.helper";
import { IUser } from "../../database/interfaces/user.interface";
import { DateHelper } from "../helpers/date.helper";
import {
  APPLICATION_FEE,
  STRIPE_FIXED,
  STRIPE_PERCENTAGE,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
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

  async addCardToCustomer(req: Request): Promise<ApiResponse> {
    const { cardNumber, expMonth, expYear, cvc }: any = req.body;

    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");

      const cardObj = {
        name: user.firstName + " " + user.lastName,
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      };

      const token = await stripeHelper.createToken({ card: cardObj });

      const card = await stripeHelper.addCard(
        user?.stripeCustomerId as string,
        token.id
      );
      if (!card) return ResponseHelper.sendResponse(404, "Card not added");
      return ResponseHelper.sendSuccessResponse(
        "Card added successfully",
        card
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async updateCardToCustomer(req: Request): Promise<ApiResponse> {
    const { expMonth, expYear, name }: any = req.body;

    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");

      const cardObj: Stripe.CustomerSourceUpdateParams = {
        exp_month: expMonth,
        exp_year: expYear,
        name,
      };

      const card = await stripeHelper.updateCard(
        user?.stripeCustomerId as string,
        req.params.id,
        cardObj
      );
      if (!card) return ResponseHelper.sendResponse(404, "Card not updated");
      return ResponseHelper.sendSuccessResponse(
        "Card updated successfully",
        card
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async getCustomerCards(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const cards = await stripeHelper.getCustomerCards(
        user.stripeCustomerId as string,
        parseInt(req.body.page)
      );

      if (cards.data.length == 0)
        return ResponseHelper.sendResponse(404, "Card list not found");
      return ResponseHelper.sendSuccessResponse("Card list found", cards);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async selectDefaultCard(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const card = await stripeHelper.selectDefaultCard(
        user.stripeCustomerId as string,
        req.params.id
      );
      return ResponseHelper.sendSuccessResponse("Default card updated", card);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async createTopUp(req: Request): Promise<ApiResponse> {
    let { amount, source, currency, description } = req.body;

    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeConnectId stripeCustomerId"
      );
      if (!user?.stripeCustomerId) {
        return ResponseHelper.sendResponse(400, "Please add a card first");
      }

      const customer = await stripeHelper.updateCustomer(
        user.stripeCustomerId,
        { source }
      );
      if (!customer) {
        return ResponseHelper.sendResponse(400, "Customer not updated");
      }

      const charge = await stripeHelper.stripeCharge({
        amount: amount * 100,
        currency: currency || "usd",
        description,
        customer: user.stripeCustomerId,
        statement_descriptor: "Top-up",
        capture: true,
      });

      const netAmount = amount - (amount * STRIPE_PERCENTAGE + STRIPE_FIXED);

      if (charge.status == "succeeded") {
        const wallet = await this.walletRepository.updateBalance(
          req.locals.auth?.userId as string,
          netAmount
        );

        this.transactionRepository.create({
          amount,
          user: req.locals.auth?.userId as string,
          type: TransactionType.topUp,
          wallet: wallet?._id,
        } as ITransaction);
        return ResponseHelper.sendSuccessResponse(
          "Top up created successfully",
          { charge, wallet }
        );
      }
      throw charge;
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async createPaymentIntent(req: Request): Promise<ApiResponse> {
    const { amount, paymentMethodId, type } = req.body;
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
        amount: amountInCents,
        payment_method: paymentMethodId,
        payment_method_types: ["card"],
        capture_method: "automatic",
        confirmation_method: "automatic",
        expand: ["payment_method"],
        receipt_email: user.email,
        customer: user.stripeCustomerId,
        use_stripe_sdk: true,
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
    const { paymentIntentId } = req.body;
    const session = await mongoose.startSession();

    try {
      // Start a transaction
      session.startTransaction();

      // Fetch payment intent
      const paymentIntent = await stripeHelper.confirmPaymentIntent(
        paymentIntentId
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
          console.log(
            `Account ${account.id} is fully activated and ready to use.`
          );
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

  async addBank(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeConnectId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const connect = await stripeHelper.getConnect(
        user.stripeConnectId as string
      );
      if (!connect)
        return ResponseHelper.sendResponse(404, "Connect not found");

      const bank = await stripeHelper.addBankAccount(
        user.stripeConnectId as string,
        { external_account: req.body }
      );
      return ResponseHelper.sendSuccessResponse("Bank account added", bank);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async updateBank(sourceId: string, req: Request): Promise<ApiResponse> {
    try {
      const { account_holder_name, account_holder_type } = req.body;
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeConnectId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const connect = await stripeHelper.getConnect(
        user.stripeConnectId as string
      );
      if (!connect)
        return ResponseHelper.sendResponse(404, "Connect not found");

      const bank = await stripeHelper.updateBankAccount(
        sourceId,
        user.stripeConnectId as string,
        {
          account_holder_name,
          account_holder_type,
        } as any
      );
      return ResponseHelper.sendSuccessResponse("Bank account updated", bank);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async deleteBank(sourceId: string, req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeConnectId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const connect = await stripeHelper.getConnect(
        user.stripeConnectId as string
      );
      if (!connect)
        return ResponseHelper.sendResponse(404, "Connect not found");

      const result = await stripeHelper.deleteBank(
        sourceId,
        user.stripeConnectId as string
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_DELETION_PASSED,
        result
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async deleteSource(sourceId: string, req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const customer = await stripeHelper.getStripeCustomer(
        user.stripeCustomerId as string
      );
      if (!customer)
        return ResponseHelper.sendResponse(404, "Customer not found");

      const result = await stripeHelper.deleteSource(
        sourceId,
        user.stripeCustomerId as string
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_DELETION_PASSED,
        result
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async getBankAccounts(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeConnectId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const banks = await stripeHelper.getBankAccounts(
        user.stripeConnectId as string,
        parseInt(req.body.page)
      );
      return ResponseHelper.sendSuccessResponse("Bank list found", banks);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async getPaymentMethods(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const paymentMethods = await stripeHelper.getPaymentMethods(
        user.stripeCustomerId as string,
        parseInt(req.body.page)
      );

      return ResponseHelper.sendSuccessResponse(
        "Payment methods list found",
        paymentMethods.data.filter(
          (a: Stripe.CustomerSource) =>
            a.object !== "source" && a.object !== "bank_account"
        )
      );
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
      console.log("status", status);
      console.log("req.params.id", req.params.id);

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
