"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const stripe_controller_1 = __importDefault(require("../controllers/stripe/stripe.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class StripeRoutes extends base_route_1.default {
    constructor() {
        super();
        this.stripeController = new stripe_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "stripe");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/customer", this.validateRequest, this.stripeController.getStripeCustomer);
        this.router.get("/connect", this.validateRequest, this.stripeController.getConnect);
        this.router.get("/cards", this.validateRequest, this.stripeController.getCustomerCards);
        this.router.post("/add-card", this.validateRequest, this.stripeController.addCardToCustomer);
        this.router.patch("/update-card/:id", this.validateRequest, this.stripeController.updateCardToCustomer);
        this.router.post("/create-top-up", this.validateRequest, this.stripeController.createTopUp);
        this.router.post("/create-payment-intent", this.validateRequest, this.stripeController.createPaymentIntent);
        this.router.post("/confirm-payment", this.validateRequest, this.stripeController.confirmPayment);
        this.router.delete("/card/:id", this.validateRequest, this.stripeController.deleteSource);
        this.router.patch("/card/default/:id", this.validateRequest, this.stripeController.selectDefaultCard);
        // this.router.post(
        //   "/apply-for-subscription",
        //   this.validateRequest,
        //   this.stripeController.applyForSubscription
        // );
        this.router.post("/webhook", this.stripeController.webhook);
        this.router.get("/banks", this.validateRequest, this.stripeController.getBankAccounts);
        this.router.post("/add-bank", this.validateRequest, this.stripeController.addBank);
        this.router.patch("/update-bank", this.validateRequest, this.stripeController.updateBank);
        this.router.delete("/bank/:id", this.validateRequest, this.stripeController.deleteBank);
        this.router.get("/payment-methods", this.validateRequest, this.stripeController.getPaymentMethods);
        this.router.post("/payout/:source", this.validateRequest, this.stripeController.payout);
    }
}
exports.default = StripeRoutes;
//# sourceMappingURL=stripe.route.js.map