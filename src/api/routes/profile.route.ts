import multer from "multer";

import { Validation } from "../../middleware/validation.middleware";
import UserController from "../controllers/user/user.controller";
import BaseRoutes from "./base.route";

class ProfileRoutes extends BaseRoutes {
  private userController: UserController;

  private validateRequest;

  constructor() {
    super();
    this.userController = new UserController();
    this.validateRequest = new Validation().reporter(true, "user");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post(
      "/check-username",
      this.validateRequest,
      this.userController.checkUsername
    );
    this.router.get("/", this.validateRequest, this.userController.index);
    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.userController.show
    );
    this.router.patch(
      "/update/:id",
      multer().any(),
      this.validateRequest,
      this.userController.update
    );
    this.router.delete(
      "/delete/:_id",
      this.validateRequest,
      this.userController.delete
    );
  }
}

export default ProfileRoutes;
