import { Validation } from "../../../middleware/validation.middleware";
import AuthController from "../../controllers/auth/auth.user.controller";
import BaseRoutes from "../base.route";

class AuthRoutes extends BaseRoutes {
  private authController: AuthController;

  private validateRequest;

  constructor() {
    super();
    this.authController = new AuthController();

    this.validateRequest = new Validation().reporter(true, "auth");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post(
      "/verify-otp",
      this.validateRequest,
      this.authController.verifyOtp
    );
    this.router.get(
      "/resend-otp",
      this.validateRequest,
      this.authController.resendOtp
    );
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
    this.router.post(
      "/change-password",
      this.validateRequest,
      this.authController.updateData
    );
  }
}

export default AuthRoutes;
