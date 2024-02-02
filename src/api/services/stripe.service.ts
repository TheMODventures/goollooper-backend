import { Request, Response } from "express";
import { UserRepository } from "../repository/user/user.repository";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { stripeHelper } from "../helpers/stripe.helper";
import { IUser } from "../../database/interfaces/user.interface";
import { SUCCESS_DATA_DELETION_PASSED } from "../../constant";
import Stripe from "stripe";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { ObjectId } from "mongodb";

class StripeService {
  private userRepository: UserRepository;
  private walletRepository: WalletRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.walletRepository = new WalletRepository();
  }

  async createWallet(email: string, dataset: Stripe.AccountCreateParams) {
    try {
      const stripeCustomer = await stripeHelper.createStripeCustomer(email);
      const stripeConnect = await stripeHelper.createConnect(email, dataset);
      return ResponseHelper.sendSuccessResponse(
        "stripe accounts created successfully",
        { stripeConnect, stripeCustomer }
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
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

  async getCustomerCards(req: Request): Promise<ApiResponse> {
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const banks = await stripeHelper.getCustomerCards(
        user.stripeCustomerId as string,
        parseInt(req.body.page)
      );
      return ResponseHelper.sendSuccessResponse("Card list found", banks);
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
        "stripeCustomerId"
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
        currency,
        customer: user.stripeCustomerId,
        description,
      });

      if (charge.status == "succeeded") {
        const wallet = await this.walletRepository.updateBalance(
          req.locals.auth?.userId as string,
          amount
        );
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
    const body = req.body;
    body.amount = body.amount * 100;

    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId ?? "",
        undefined,
        "stripeCustomerId"
      );
      if (!user?.stripeCustomerId) {
        return ResponseHelper.sendResponse(400, "Please add a card first");
      }

      body.customer = user?.stripeCustomerId;

      const paymentIntent = await stripeHelper.createPaymentIntent(body);
      return ResponseHelper.sendSuccessResponse(
        "Payment intent created successfully",
        paymentIntent
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async confirmPayment(req: Request): Promise<ApiResponse> {
    const { paymentIntentId } = req.body;
    try {
      const paymentIntent = await stripeHelper.confirmPaymentIntent(
        paymentIntentId
      );
      return ResponseHelper.sendSuccessResponse(
        "Payment intent confirmed successfully",
        paymentIntent
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async webhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = await stripeHelper.stripeWebHook(req.body, sig as string);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      return;
    }

    console.log("event >>>>>>>>>>", event);

    // Handle the event
    switch (event.type) {
      case "customer.subscription.pending_update_expired":
        const customerSubscriptionPendingUpdateExpired = event.data.object;
        // Then define and call a function to handle the event customer.subscription.pending_update_expired
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }

  async getStripeCustomer(req: Request): Promise<ApiResponse> {
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
}

export default StripeService;
