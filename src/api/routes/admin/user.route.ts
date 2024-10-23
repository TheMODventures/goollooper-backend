import { Validation } from "../../../middleware/validation.middleware";
import TaskController from "../../controllers/task/task.controller";
import UserController from "../../controllers/user/user.controller";
import BaseRoutes from "../base.route";

class UserRoutes extends BaseRoutes {
  private userController: UserController;
  private taskController: TaskController;
  private validateRequest;

  constructor() {
    super();
    this.userController = new UserController();
    this.taskController = new TaskController();
    this.validateRequest = new Validation().reporter(true, "user");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.userController.index);
    this.router.put(
      "/block/:id",
      this.validateRequest,
      this.userController.blockUser
    );
    this.router.get("/flag-task", this.taskController.flagTasks);
    this.router.get("/reported-users", this.userController.reportedUsers);
  }
}

export default UserRoutes;
