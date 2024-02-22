import multer from "multer";
import { Request, Response, NextFunction } from "express";

import { Validation } from "../../middleware/validation.middleware";
import BaseRoutes from "./base.route";
import TaskController from "../controllers/task/task.controller";
import { validateFiles } from "../../validator/userFile.validate";

class TaskRoutes extends BaseRoutes {
  private taskController: TaskController;
  private validateRequest;

  constructor() {
    super();
    this.taskController = new TaskController();
    this.validateRequest = new Validation().reporter(true, "task");
    this.initializeRoutes();
  }

  private validateFilesMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const fields = ["media", "subTaskMedia"];

      fields.forEach((field) => {
        const files = (req.files as Express.Multer.File[])?.filter(
          (file) => file.fieldname === field
        );
        if (files) {
          validateFiles(files, field, res);
        }
      });
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  protected routes(): void {
    this.router.patch("/", this.validateRequest, this.taskController.index);
    this.router.get(
      "/my-task",
      this.validateRequest,
      this.taskController.myTasks
    );
    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.taskController.show
    );
    this.router.post(
      "/create",
      multer().any(),
      this.validateFilesMiddleware,
      this.validateRequest,
      this.taskController.create
    );
    this.router.patch(
      "/update/:id",
      multer().any(),
      this.validateFilesMiddleware,
      this.validateRequest,
      this.taskController.update
    );
    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.taskController.delete
    );

    this.router.put(
      "/request/:id",
      this.validateRequest,
      this.taskController.requestToAdded
    );

    this.router.put(
      "/toggle-request/:id",
      this.validateRequest,
      this.taskController.toggleRequest
    );
  }
}

export default TaskRoutes;
