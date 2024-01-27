import { Validation } from "../../../middleware/validation.middleware";
import UserController from "../../controllers/user/user.controller";
import BaseRoutes from "../base.route";

class SubAdminRoutes extends BaseRoutes {
  private userController: UserController;

  private validateRequest;

  constructor() {
    super();
    this.userController = new UserController();
    this.validateRequest = new Validation().reporter(true, "subadmin");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.userController.getSubAdmin);
    this.router.get("/:id", this.validateRequest, this.userController.show);
    this.router.post(
      "/create",
      this.validateRequest,
      this.userController.addSubAdmin
    );
    this.router.post(
      "/update/:id",
      this.validateRequest,
      this.userController.update
    );
    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.userController.deleteSubAdmin
    );
  }
}

export default SubAdminRoutes;
