import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import TaskService from "../../services/task.service";
import { ITaskPayload } from "../../../database/interfaces/task.interface";

class TaskController {
  protected taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, title = "" } = req.query;
    const limitNow = limit ? limit : 10;

    const response = await this.taskService.index(
      req.body.taskInterests as string[],
      req.locals.auth?.userId as string,
      Number(page),
      Number(limitNow),
      title as string
    );
    return res.status(response.code).json(response);
  };

  myTasks = async (req: Request, res: Response) => {
    const { limit, page, type } = req.query;
    const limitNow = limit ? limit : 10;
    const response = await this.taskService.myTasks(
      Number(page),
      Number(limitNow),
      type as string,
      req.locals.auth?.userId as string
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ITaskPayload = { ...req.body };
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
    const dataset: Partial<ITaskPayload> = { ...req.body };
    const response = await this.taskService.update(id, dataset, req);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.taskService.delete(id);
    return res.status(response.code).json(response);
  };

  requestToAdded = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.taskService.requestToAdded(
      id,
      req.locals.auth?.userId as string
    );
    console.log(id);
    return res.status(response.code).json(response);
  };

  toggleRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user, status, type } = req.body;
    const response = await this.taskService.toggleRequest(
      id,
      req.locals.auth?.userId as string,
      user as string,
      status,
      type
    );
    return res.status(response.code).json(response);
  };

  cancel = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.taskService.cancelTask(id as string);
    console.log("response", response);

    return res.status(response.code).json(response);
  };
}

export default TaskController;
