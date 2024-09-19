import { Validation } from "../../middleware/validation.middleware";
import BaseRoutes from "./base.route";
import { Authorize } from "../../middleware/authorize.middleware";
import IndustryController from "../controllers/industry/industry.controller";

class IndustryRoute extends BaseRoutes {
  private industryController: IndustryController;
  private authorize: Authorize;
  private validateRequest;

  constructor() {
    super();
    this.industryController = new IndustryController();
    this.authorize = new Authorize();
    this.validateRequest = new Validation().reporter(true, "industry");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post(
      "/create",
      this.validateRequest,
      this.industryController.create
    );

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.industryController.delete
    );

    this.router.get("/", this.validateRequest, this.industryController.index);
  }
}

export default IndustryRoute;
