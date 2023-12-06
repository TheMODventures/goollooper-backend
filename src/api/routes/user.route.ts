import { Authorize } from "../../middleware/authorize.middleware";
import BaseRoutes from "./base.route";
import AuthRoutes from "./auth.user.route";
import ServiceRoutes from "./service.route";
import SubscriptionRoutes from "./subscription.route";
import ProfileRoutes from "./profile.route";
import StateRoutes from "./state.route";
import GolistRoutes from "./golist.route";

class UserRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private serviceRoutes: ServiceRoutes;
  private subscriptionRoutes: SubscriptionRoutes;
  private profileRoutes: ProfileRoutes;
  private stateRoutes: StateRoutes;
  private authorize: Authorize;
  private golistRoutes: GolistRoutes;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();
    this.serviceRoutes = new ServiceRoutes();
    this.subscriptionRoutes = new SubscriptionRoutes();
    this.profileRoutes = new ProfileRoutes();
    this.stateRoutes = new StateRoutes();
    this.authorize = new Authorize();
    this.golistRoutes = new GolistRoutes();
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.use("/auth", this.authRoutes.router);
    this.router.use(this.authorize.validateAuth);
    this.router.use("/service", this.serviceRoutes.router);
    this.router.use("/subscription", this.subscriptionRoutes.router);
    this.router.use("/user", this.profileRoutes.router);
    this.router.use("/location-data", this.stateRoutes.router);
    this.router.use("/golist", this.golistRoutes.router);
  }
}

export default UserRoutes;
