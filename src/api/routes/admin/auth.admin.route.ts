import { Validation } from "../../../middleware/validation.middleware";
import AuthController from "../../controllers/auth/auth.admin.controller";
import BaseRoutes from "../base.route";
import UserRoutes from "./user.admin.route";

class AuthRoutes extends BaseRoutes {
  private authController: AuthController;

  private userRoute: UserRoutes;

  private validateRequest;

  constructor() {
    super();
    this.authController = new AuthController();

    this.userRoute = new UserRoutes();

    this.validateRequest = new Validation().reporter(true, "auth");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post(
      "/logout",
      this.validateRequest,
      this.authController.logout
    );
    this.router.post(
      "/update-detail",
      this.validateRequest,
      this.authController.updateData
    );
    this.router.post(
      "/update-password",
      this.validateRequest,
      this.authController.updateData
    );
    this.router.use("/user", this.userRoute.router);
  }
}

export default AuthRoutes;
