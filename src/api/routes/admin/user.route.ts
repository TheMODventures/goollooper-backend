import { Validation } from "../../../middleware/validation.middleware";
import UserController from "../../controllers/user/user.controller";
import BaseRoutes from "../base.route";

class UserRoutes extends BaseRoutes {
  private userController: UserController;

  private validateRequest;

  constructor() {
    super();
    this.userController = new UserController();
    this.validateRequest = new Validation().reporter(true, "user");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/index", this.validateRequest, this.userController.index);
  }
}

export default UserRoutes;
