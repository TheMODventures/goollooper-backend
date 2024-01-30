import multer from "multer";

import { Validation } from "../../middleware/validation.middleware";
import GuidelineController from "../controllers/guideline/guideline.controller";
import BaseRoutes from "./base.route";
import { Authorize } from "../../middleware/authorize.middleware";

class GuidelineRoutes extends BaseRoutes {
  private guidelineController: GuidelineController;
  private authorize: Authorize;
  private validateRequest;

  constructor() {
    super();
    this.guidelineController = new GuidelineController();
    this.authorize = new Authorize();
    this.validateRequest = new Validation().reporter(true, "guideline");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.guidelineController.index);

    this.router.use((req, res, next) =>
      this.authorize.validateAuth(req, res, next, true)
    );

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
