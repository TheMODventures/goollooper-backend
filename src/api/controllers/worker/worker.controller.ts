import { Request, Response } from "express";
import { WorkerService } from "../../services/worker.service";

class WorkerController {
  workerService: WorkerService;

  constructor() {
    this.workerService = new WorkerService();
  }

  index = async (req: Request, res: Response) => {
    const response = await this.workerService.index(req);
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload = { ...req.body, employer: req.locals.auth?.userId };
    const response = await this.workerService.create(payload, req);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.workerService.delete(id, req);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.workerService.update(id, req.body, req);
    return res.status(response.code).json(response);
  };

  createMultiple = async (req: Request, res: Response) => {
    const payload = req.body;
    const response = await this.workerService.createMultiple(
      payload.workers,
      req
    );
    return res.status(response.code).json(response);
  };
}

export default WorkerController;
