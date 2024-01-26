import { Authorize } from "../../../middleware/authorize.middleware";
import BaseRoutes from "../base.route";
import AuthRoutes from "./auth.admin.route";
import StatsRoutes from "./states.route";

class AdminRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private statsRoutes: StatsRoutes;

  private authorize: Authorize;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();
    this.statsRoutes = new StatsRoutes();

    this.authorize = new Authorize();

    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.use("/auth", this.authRoutes.router);
    this.router.use((req, res, next) =>
      this.authorize.validateAuth(req, res, next, true)
    );
    this.router.use("/stats", this.statsRoutes.router);
  }
}

export default AdminRoutes;
