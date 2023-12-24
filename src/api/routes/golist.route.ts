import { Validation } from "../../middleware/validation.middleware";
import BaseRoutes from "./base.route";
import GolistController from "../controllers/golist/golist.controller";

class GolistRoutes extends BaseRoutes {
  private golistController: GolistController;
  private validateRequest;

  constructor() {
    super();
    this.golistController = new GolistController();
    this.validateRequest = new Validation().reporter(true, "golist");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.golistController.index);
    this.router.post(
      "/create",
      this.validateRequest,
      this.golistController.create
    );
    this.router.get(
      "/show/my-list",
      // this.validateRequest,
      this.golistController.showMyList
    );

    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.golistController.show
    );

    this.router.patch(
      "/update/:id",
      this.validateRequest,
      this.golistController.update
    );

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.golistController.delete
    );

    this.router.get(
      "/nearest-service-provider",
      this.validateRequest,
      this.golistController.getNearestServiceProviders
    );
  }
}

export default GolistRoutes;
