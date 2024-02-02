import { Validation } from "../../middleware/validation.middleware";
import StripeController from "../controllers/stripe/stripe.controller";
import BaseRoutes from "./base.route";

class StripeRoutes extends BaseRoutes {
  private stripeController: StripeController;
  private validateRequest;

  constructor() {
    super();
    this.stripeController = new StripeController();
    this.validateRequest = new Validation().reporter(true, "stripe");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get(
      "/customer",
      this.validateRequest,
      this.stripeController.getStripeCustomer
    );

    this.router.get(
      "/cards",
      this.validateRequest,
      this.stripeController.getCustomerCards
    );

    this.router.post(
      "/add-card",
      this.validateRequest,
      this.stripeController.addCardToCustomer
    );

    this.router.post(
      "/create-top-up",
      this.validateRequest,
      this.stripeController.createTopUp
    );

    this.router.post(
      "/create-payment-intent",
      this.validateRequest,
      this.stripeController.createPaymentIntent
    );

    this.router.post(
      "/confirm-payment",
      this.validateRequest,
      this.stripeController.confirmPayment
    );

    this.router.delete(
      "/card/:id",
      this.validateRequest,
      this.stripeController.deleteSource
    );

    this.router.patch(
      "/card/default/:id",
      this.validateRequest,
      this.stripeController.selectDefaultCard
    );

    // this.router.post(
    //   "/apply-for-subscription",
    //   this.validateRequest,
    //   this.stripeController.applyForSubscription
    // );

    this.router.post("/webhook", this.stripeController.webhook);

    this.router.get(
      "/banks",
      this.validateRequest,
      this.stripeController.getBankAccounts
    );

    this.router.post(
      "/add-bank",
      this.validateRequest,
      this.stripeController.addBank
    );

    this.router.patch(
      "/update-bank",
      this.validateRequest,
      this.stripeController.updateBank
    );

    this.router.delete(
      "/bank/:id",
      this.validateRequest,
      this.stripeController.deleteSource
    );

    this.router.get(
      "/payment-methods",
      this.validateRequest,
      this.stripeController.getPaymentMethods
    );
  }
}

export default StripeRoutes;
