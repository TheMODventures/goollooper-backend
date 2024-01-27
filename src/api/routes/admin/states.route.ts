import StatsController from "../../controllers/stats/stats.controller";
import BaseRoutes from "../base.route";

class StatsRoutes extends BaseRoutes {
  private statsController: StatsController;

  constructor() {
    super();
    this.statsController = new StatsController();

    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.statsController.index);
  }
}

export default StatsRoutes;
