import { Request, Response } from "express";
import StripeService from "../../services/stripe.service";

class StripeController {
  protected stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  addCardToCustomer = async (req: Request, res: Response) => {
    const response = await this.stripeService.addCardToCustomer(req);
    return res.status(response.code).json(response);
  };

  getCustomerCards = async (req: Request, res: Response) => {
    const response = await this.stripeService.getCustomerCards(req);
    return res.status(response.code).json(response);
  };

  selectDefaultCard = async (req: Request, res: Response) => {
    const response = await this.stripeService.selectDefaultCard(req);
    return res.status(response.code).json(response);
  };

  createTopUp = async (req: Request, res: Response) => {
    const response = await this.stripeService.createTopUp(req);
    return res.status(response.code).json(response);
  };

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

  addBank = async (req: Request, res: Response) => {
    const response = await this.stripeService.addBank(req);
    return res.status(response.code).json(response);
  };

  updateBank = async (req: Request, res: Response) => {
    const response = await this.stripeService.updateBank(req.body.source, req);
    return res.status(response.code).json(response);
  };

  deleteBank = async (req: Request, res: Response) => {
    const response = await this.stripeService.deleteBank(req.params.id, req);
    return res.status(response.code).json(response);
  };

  deleteSource = async (req: Request, res: Response) => {
    const response = await this.stripeService.deleteSource(req.params.id, req);
    return res.status(response.code).json(response);
  };

  getBankAccounts = async (req: Request, res: Response) => {
    const response = await this.stripeService.getBankAccounts(req);
    return res.status(response.code).json(response);
  };

  getPaymentMethods = async (req: Request, res: Response) => {
    const response = await this.stripeService.getPaymentMethods(req);
    return res.status(response.code).json(response);
  };
}

export default StripeController;
