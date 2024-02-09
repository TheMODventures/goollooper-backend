import { Validation } from "../../middleware/validation.middleware";
import NotificationController from "../controllers/notification/notification.controller";
import BaseRoutes from "./base.route";

class NotificationRoutes extends BaseRoutes {
  private notificationController: NotificationController;
  private validateRequest;

  constructor() {
    super();
    this.notificationController = new NotificationController();
    this.validateRequest = new Validation().reporter(true, "notification");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get(
      "/",
      //   this.validateRequest,
      this.notificationController.index
    );

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.notificationController.delete
    );
  }
}

export default NotificationRoutes;
