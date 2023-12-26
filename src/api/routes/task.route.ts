import { Validation } from "../../middleware/validation.middleware";
import BaseRoutes from "./base.route";
import TaskController from "../controllers/task/task.controller";
import SearchService from "../services/task.service";

class TaskRoutes extends BaseRoutes {
  private taskController: TaskController;
  private validateRequest;

  constructor() {
    super();
    this.taskController = new TaskController();
    this.validateRequest = new Validation().reporter(true, "task");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.post("/", this.validateRequest, this.taskController.index);

    this.router.post(
      "/create",
      this.validateRequest,
      this.taskController.create
    );

    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.taskController.show
    );

    this.router.patch(
      "/update/:id",
      this.validateRequest,
      this.taskController.update
    );

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.taskController.delete
    );
  }
}

export default TaskRoutes;
