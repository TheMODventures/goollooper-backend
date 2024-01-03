import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import TaskService from "../../services/task.service";
import { ITask } from "../../../database/interfaces/task.interface";

class TaskController {
  protected taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, name = "" } = req.query;
    const limitNow = limit ? limit : 10;

    const response = await this.taskService.index(
      req.body.taskInterests as string[],
      req.locals.auth?.userId as string,
      Number(page),
      Number(limitNow)
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ITask = { ...req.body };
    const response = await this.taskService.create(payload, req);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.taskService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<ITask> = { ...req.body };

    const response = await this.taskService.update(id, dataset, req);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.taskService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default TaskController;
