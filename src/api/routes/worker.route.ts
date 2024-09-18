import { NextFunction, Request, Response } from "express";
import { Validation } from "../../middleware/validation.middleware";
import BaseRoutes from "./base.route";
import WorkerController from "../controllers/worker/worker.controller";

class WorkerRoutes extends BaseRoutes {
  private validateRequest;
  private workerController: WorkerController;

  constructor() {
    super();
    this.validateRequest = new Validation().reporter(true, "worker");
    this.workerController = new WorkerController();
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get("/", this.validateRequest, this.workerController.index);

    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.workerController.delete
    );

    this.router.put(
      "/update/:id",
      this.validateRequest,
      this.workerController.update
    );

    this.router.post(
      "/create",
      this.validateRequest,
      this.workerController.create
    );
  }
}

export default WorkerRoutes;
