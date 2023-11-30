import { Authorize } from "../../middleware/authorize.middleware";
import BaseRoutes from "./base.route";
import AuthRoutes from "./auth.user.route";
import ServiceRoutes from "./service.route";
import SubscriptionRoutes from "./subscription.route";
import ProfileRoutes from "./profile.route";

class UserRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private serviceRoutes: ServiceRoutes;
  private subscriptionRoutes: SubscriptionRoutes;
  private profileRoutes: ProfileRoutes;
  private authorize: Authorize;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();
    this.serviceRoutes = new ServiceRoutes();
    this.subscriptionRoutes = new SubscriptionRoutes();
    this.profileRoutes = new ProfileRoutes();
    this.authorize = new Authorize();
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.use("/auth", this.authRoutes.router);
    this.router.use(this.authorize.validateAuth);
    this.router.use("/service", this.serviceRoutes.router);
    this.router.use("/subscription", this.subscriptionRoutes.router);
    this.router.use("/user", this.profileRoutes.router);
  }
}

export default UserRoutes;
