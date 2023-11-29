import { Authorize } from "../../middleware/authorize.middleware";
import { Validation } from "../../middleware/validation.middleware";
import BaseRoutes from "./base.route";
import AuthRoutes from "./auth.user.route";
import ServiceRoutes from "./service.route";

class UserRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private serviceRoutes: ServiceRoutes;
  private validateRequest;
  private authorize: Authorize;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();
    this.serviceRoutes = new ServiceRoutes();
    this.authorize = new Authorize();
    this.validateRequest = new Validation().reporter(true, "auth");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.use("/auth", this.authRoutes.router);
    this.router.use(this.authorize.validateAuth);
    this.router.use("/service", this.serviceRoutes.router);
  }
}

export default UserRoutes;
