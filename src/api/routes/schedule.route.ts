import { Validation } from "../../middleware/validation.middleware";
import ScheduleController from "../controllers/schedule/schedule.controller";
import BaseRoutes from "./base.route";

class ScheduleRoutes extends BaseRoutes {
  private scheduleController: ScheduleController;
  private validateRequest;

  constructor() {
    super();
    this.scheduleController = new ScheduleController();
    this.validateRequest = new Validation().reporter(true, "schedule");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.scheduleController.index);

    this.router.post(
      "/create",
      this.validateRequest,
      this.scheduleController.create
    );

    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.scheduleController.show
    );

    this.router.patch(
      "/update/:id",
      this.validateRequest,
      this.scheduleController.update
    );

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.scheduleController.delete
    );
  }
}

export default ScheduleRoutes;
