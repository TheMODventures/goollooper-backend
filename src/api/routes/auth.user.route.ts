import { Authorize } from "../../middleware/authorize.middleware";
import { Validation } from "../../middleware/validation.middleware";
import AuthController from "../controllers/auth/auth.user.controller";
import BaseRoutes from "./base.route";

class AuthRoutes extends BaseRoutes {
  private authController: AuthController;
  private authorize: Authorize;

  private validateRequest;

  constructor() {
    super();
    this.authController = new AuthController();

    this.authorize = new Authorize();
    this.validateRequest = new Validation().reporter(true, "auth");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post(
      "/register",
      this.validateRequest,
      this.authController.register
    );
    this.router.post("/login", this.validateRequest, this.authController.login);
    this.router.post(
      "/forget-password",
      this.validateRequest,
      this.authController.forgetPassword
    );
    this.router.post(
      "/get-new-token",
      this.validateRequest,
      this.authController.getAccessToken
    );
    this.router.use(this.authorize.validateAuth);
    this.router.post(
      "/reset-password",
      this.validateRequest,
      this.authController.updateData
    );
    this.router.post(
      "/send-otp",
      this.validateRequest,
      this.authController.resendOtp
    );
    this.router.post(
      "/verify-otp",
      this.validateRequest,
      this.authController.verifyOtp
    );
    this.router.post(
      "/logout",
      this.validateRequest,
      this.authController.logout
    );
  }
}

export default AuthRoutes;
