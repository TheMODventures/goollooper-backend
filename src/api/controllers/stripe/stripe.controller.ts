import { Request, Response } from "express";
import StripeService from "../../services/stripe.service";

class StripeController {
  protected stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  createPaymentIntent = async (req: Request, res: Response) => {
    const response = await this.stripeService.createPaymentIntent(req);
    return res.status(response.code).json(response);
  };

  confirmPayment = async (req: Request, res: Response) => {
    const response = await this.stripeService.confirmPayment(req);
    return res.status(response.code).json(response);
  };

  webhook = async (req: Request, res: Response) => {
    await this.stripeService.webhook(req, res);
  };

  getStripeCustomer = async (req: Request, res: Response) => {
    const response = await this.stripeService.getStripeCustomer(req);
    return res.status(response.code).json(response);
  };

  getConnect = async (req: Request, res: Response) => {
    const response = await this.stripeService.getConnect(
      req.locals.auth?.userId!
    );
    return res.status(response.code).json(response);
  };

  payout = async (req: Request, res: Response) => {
    const response = await this.stripeService.payout(req);
    return res.status(response.code).json(response);
  };
  onboarding = async (req: Request, res: Response) => {
    const response = await this.stripeService.onboarding(req);
    return res.status(response.code).json(response);
  };
  stripeBalance = async (req: Request, res: Response) => {
    const response = await this.stripeService.stripeBalance(req);
    return res.status(response.code).json(response);
  };
  withdrawRequest = async (req: Request, res: Response) => {
    const response = await this.stripeService.withdrawRequest(req);
    return res.status(response.code).json(response);
  };
  toggleWithdrawRequest = async (req: Request, res: Response) => {
    const response = await this.stripeService.toggleWithdrawRequest(req);
    return res.status(response.code).json(response);
  };
}

export default StripeController;
