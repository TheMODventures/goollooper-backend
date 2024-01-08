import { Validation } from "../../middleware/validation.middleware";
import CalendarController from "../controllers/calendar/calendar.controller";
import BaseRoutes from "./base.route";

class CalendarRoutes extends BaseRoutes {
  private calendarController: CalendarController;
  private validateRequest;

  constructor() {
    super();
    this.calendarController = new CalendarController();
    this.validateRequest = new Validation().reporter(true, "calendar");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.calendarController.index);

    this.router.post(
      "/create",
      this.validateRequest,
      this.calendarController.create
    );

    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.calendarController.show
    );

    this.router.patch(
      "/update/:id",
      this.validateRequest,
      this.calendarController.update
    );

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.calendarController.delete
    );
  }
}

export default CalendarRoutes;
