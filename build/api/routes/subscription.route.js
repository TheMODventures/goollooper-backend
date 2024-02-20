"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const subscription_controller_1 = __importDefault(require("../controllers/subscription/subscription.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class SubscriptionRoutes extends base_route_1.default {
    constructor() {
        super();
        this.subscriptionController = new subscription_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "subscription");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.subscriptionController.index);
        this.router.post("/create", this.validateRequest, this.subscriptionController.create);
        this.router.get("/show/:id", this.validateRequest, this.subscriptionController.show);
        this.router.patch("/update/:id", this.validateRequest, this.subscriptionController.update);
        this.router.delete("/delete/:id", this.validateRequest, this.subscriptionController.delete);
        // plan routes
        this.router.post("/subscription-plan/create/:subscriptionId", this.validateRequest, this.subscriptionController.addPlan);
        this.router.patch("/subscription-plan/update/:subscriptionId/:id", this.validateRequest, this.subscriptionController.updatePlan);
        this.router.delete("/subscription-plan/delete/:subscriptionId/:id", this.validateRequest, this.subscriptionController.deletePlan);
    }
}
exports.default = SubscriptionRoutes;
//# sourceMappingURL=subscription.route.js.map