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
    this.router.get(
      "/trash-index",
      this.validateRequest,
      this.userController.trashIndex
    );
    this.router.get(
      "/show/:_id",
      this.validateRequest,
      this.userController.show
    );
    this.router.patch(
      "/update/:_id",
      this.validateRequest,
      this.userController.update
    );
    this.router.patch(
      "/trash/:_id",
      this.validateRequest,
      this.userController.trash
    );

    this.router.patch(
      "/restore/:_id",
      this.validateRequest,
      this.userController.restore
    );
    this.router.delete(
      "/delete/:_id",
      this.validateRequest,
      this.userController.delete
    );
  }
}

export default UserRoutes;
