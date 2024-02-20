"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_service_1 = __importDefault(require("../../services/stripe.service"));
class StripeController {
    constructor() {
        this.addCardToCustomer = async (req, res) => {
            const response = await this.stripeService.addCardToCustomer(req);
            return res.status(response.code).json(response);
        };
        this.updateCardToCustomer = async (req, res) => {
            const response = await this.stripeService.updateCardToCustomer(req);
            return res.status(response.code).json(response);
        };
        this.getCustomerCards = async (req, res) => {
            const response = await this.stripeService.getCustomerCards(req);
            return res.status(response.code).json(response);
        };
        this.selectDefaultCard = async (req, res) => {
            const response = await this.stripeService.selectDefaultCard(req);
            return res.status(response.code).json(response);
        };
        this.createTopUp = async (req, res) => {
            const response = await this.stripeService.createTopUp(req);
            return res.status(response.code).json(response);
        };
        this.createPaymentIntent = async (req, res) => {
            const response = await this.stripeService.createPaymentIntent(req);
            return res.status(response.code).json(response);
        };
        this.confirmPayment = async (req, res) => {
            const response = await this.stripeService.confirmPayment(req);
            return res.status(response.code).json(response);
        };
        this.webhook = async (req, res) => {
            await this.stripeService.webhook(req, res);
        };
        this.getStripeCustomer = async (req, res) => {
            const response = await this.stripeService.getStripeCustomer(req);
            return res.status(response.code).json(response);
        };
        this.getConnect = async (req, res) => {
            const response = await this.stripeService.getConnect(req.locals.auth?.userId);
            return res.status(response.code).json(response);
        };
        this.addBank = async (req, res) => {
            const response = await this.stripeService.addBank(req);
            return res.status(response.code).json(response);
        };
        this.updateBank = async (req, res) => {
            const response = await this.stripeService.updateBank(req.body.source, req);
            return res.status(response.code).json(response);
        };
        this.deleteBank = async (req, res) => {
            const response = await this.stripeService.deleteBank(req.params.id, req);
            return res.status(response.code).json(response);
        };
        this.deleteSource = async (req, res) => {
            const response = await this.stripeService.deleteSource(req.params.id, req);
            return res.status(response.code).json(response);
        };
        this.getBankAccounts = async (req, res) => {
            const response = await this.stripeService.getBankAccounts(req);
            return res.status(response.code).json(response);
        };
        this.getPaymentMethods = async (req, res) => {
            const response = await this.stripeService.getPaymentMethods(req);
            return res.status(response.code).json(response);
        };
        this.payout = async (req, res) => {
            const response = await this.stripeService.payout(req);
            return res.status(response.code).json(response);
        };
        this.stripeService = new stripe_service_1.default();
    }
}
exports.default = StripeController;
//# sourceMappingURL=stripe.controller.js.map