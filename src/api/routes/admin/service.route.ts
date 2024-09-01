import { Validation } from "../../../middleware/validation.middleware";
import ServiceController from "../../controllers/service/service.controller";
import BaseRoutes from "../base.route";

class ServiceRoutes extends BaseRoutes {
  private serviceController: ServiceController;
  private validateRequest;

  constructor() {
    super();
    this.serviceController = new ServiceController();
    this.validateRequest = new Validation().reporter(true, "service");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.serviceController.index);

    // this.router.post(
    //   "/create",
    //   this.validateRequest,
    //   this.serviceController.create
    // );

    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.serviceController.show
    );

    this.router.patch(
      "/update/:id",
      this.validateRequest,
      this.serviceController.update
    );
    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.serviceController.delete
    );
  }
}

export default ServiceRoutes;
