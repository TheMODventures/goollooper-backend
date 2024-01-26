import BaseRoutes from "../base.route";
import AuthRoutes from "./auth.admin.route";

class AdminRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();

    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.use("/auth", this.authRoutes.router);
  }
}

export default AdminRoutes;
