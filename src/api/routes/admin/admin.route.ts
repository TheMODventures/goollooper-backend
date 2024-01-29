import { Authorize } from "../../../middleware/authorize.middleware";
import BaseRoutes from "../base.route";
import AuthRoutes from "./auth.admin.route";
import UserRoutes from "./user.route";
import StatsRoutes from "./states.route";
import SubAdminRoutes from "./subadmin.route";
import NotificationRoutes from "./notification.route";

class AdminRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private statsRoutes: StatsRoutes;
  private userRoutes: UserRoutes;
  private subAdminRoutes: SubAdminRoutes;
  private notificationRoutes: NotificationRoutes;

  private authorize: Authorize;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();
    this.statsRoutes = new StatsRoutes();
    this.userRoutes = new UserRoutes();
    this.subAdminRoutes = new SubAdminRoutes();
    this.notificationRoutes = new NotificationRoutes();

    this.authorize = new Authorize();

    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.use("/auth", this.authRoutes.router);
    this.router.use((req, res, next) =>
      this.authorize.validateAuth(req, res, next, true)
    );
    this.router.use("/stats", this.statsRoutes.router);
    this.router.use("/user", this.userRoutes.router);
    this.router.use("/sub-admin", this.subAdminRoutes.router);
    this.router.use("/notification", this.notificationRoutes.router);
  }
}

export default AdminRoutes;
