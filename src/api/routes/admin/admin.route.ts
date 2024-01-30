import { EUserRole } from "../../../database/interfaces/enums";
import { Authorize } from "../../../middleware/authorize.middleware";
import { Validation } from "../../../middleware/validation.middleware";
import AuthController from "../../controllers/auth/auth.admin.controller";
import BaseRoutes from "../base.route";
import AuthRoutes from "./auth.admin.route";

class AdminRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private validateRequest;
  private authorize: Authorize;
  private authController: AuthController;

  constructor() {
    super();
    this.authController = new AuthController();
    this.authRoutes = new AuthRoutes();
    this.authorize = new Authorize();
    this.validateRequest = new Validation().reporter(true, "auth");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post("/login", this.validateRequest, this.authController.login);
    this.router.post(
      "/get-new-token",
      this.validateRequest,
      this.authController.getAccessToken
    );
    // this.router.use(this.authorize.validateAuth(EUserRole.admin));
    this.router.use("/auth", this.authRoutes.router);
  }
}

export default AdminRoutes;
