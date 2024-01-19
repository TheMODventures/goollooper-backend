import { Validation } from "../../middleware/validation.middleware";
import RatingController from "../controllers/rating/rating.controller";
import BaseRoutes from "./base.route";

class RatingRoutes extends BaseRoutes {
  private ratingController: RatingController;
  private validateRequest;

  constructor() {
    super();
    this.ratingController = new RatingController();
    this.validateRequest = new Validation().reporter(true, "rating");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get(
      "/:user",
      this.validateRequest,
      this.ratingController.index
    );
    this.router.post(
      "/create",
      this.validateRequest,
      this.ratingController.create
    );
    this.router.post(
      "/create/multiple",
      this.validateRequest,
      this.ratingController.createMultiple
    );
  }
}

export default RatingRoutes;
