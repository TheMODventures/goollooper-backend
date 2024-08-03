import { Validation } from "../../middleware/validation.middleware";
import SubscriptionController from "../controllers/subscription/subscription.controller";
import BaseRoutes from "./base.route";

class SubscriptionRoutes extends BaseRoutes {
  private subscriptionController: SubscriptionController;
  private validateRequest;

  constructor() {
    super();
    this.subscriptionController = new SubscriptionController();
    this.validateRequest = new Validation().reporter(true, "subscription");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get(
      "/",
      this.validateRequest,
      this.subscriptionController.index
    );
    this.router.post(
      "/create",
      this.validateRequest,
      this.subscriptionController.create
    );
    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.subscriptionController.show
    );
  }
}

export default SubscriptionRoutes;
