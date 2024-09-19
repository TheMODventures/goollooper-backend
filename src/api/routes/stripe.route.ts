import { Validation } from "../../middleware/validation.middleware";
import StripeController from "../controllers/stripe/stripe.controller";
import BaseRoutes from "./base.route";
import express from "express"; // Import the 'express' module

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
      "/connect",
      this.validateRequest,
      this.stripeController.getConnect
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

    this.router.post(
      "/payout",
      this.validateRequest,
      this.stripeController.payout
    );

    this.router.post("/onboarding", this.stripeController.onboarding);

    this.router.post(
      "/withdraw-request",
      this.validateRequest,
      this.stripeController.withdrawRequest
    );

    this.router.get("/balance", this.stripeController.stripeBalance);

    this.router.put(
      "/toggle-withdraw-request/:id",
      this.validateRequest,
      this.stripeController.toggleWithdrawRequest
    );

    this.router.get(
      "/goollooper-balance",
      this.stripeController.goollooperBalance
    );
  }
}

export default StripeRoutes;
