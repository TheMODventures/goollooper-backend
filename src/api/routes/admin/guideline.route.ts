import { Validation } from "../../../middleware/validation.middleware";
import GuidelineController from "../../controllers/guideline/guideline.controller";
import BaseRoutes from "../base.route";

class GuidelineRoutes extends BaseRoutes {
  private guidelineController: GuidelineController;
  private validateRequest;

  constructor() {
    super();
    this.guidelineController = new GuidelineController();
    this.validateRequest = new Validation().reporter(true, "guideline");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.guidelineController.index);
    this.router.post(
      "/create",
      this.validateRequest,
      this.guidelineController.create
    );
    this.router.patch(
      "/update/:id",
      this.validateRequest,
      this.guidelineController.update
    );
  }
}

export default GuidelineRoutes;
