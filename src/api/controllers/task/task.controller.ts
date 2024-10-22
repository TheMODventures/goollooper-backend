import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";

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

    const filter: any = {
      postedBy: {
        $ne: new mongoose.Types.ObjectId(req.locals.auth?.userId as string),
      },
      isDeleted: false,
    };

    const response = await this.taskService.index(
      req.body.taskInterests as string[],
      req.locals.auth?.userId as string,
      Number(page),
      Number(limitNow),
      filter,
      title as string
    );
    return res.status(response.code).json(response);
  };

  flagTasks = async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const limitNow = limit ? limit : 10;

    const filter: any = {
      isDeleted: false,
      flag: true,
    };

    const response = await this.taskService.index(
      req.body.taskInterests as string[],
      req.locals.auth?.userId as string,
      Number(page),
      Number(limitNow),
      filter
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
    // console.log(id);
    return res.status(response.code).json(response);
  };

  toggleRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user, status, isRequestToBeAdded = false } = req.body;
    const response = await this.taskService.toggleRequest(
      id,
      req.locals.auth?.userId as string,
      user as string,
      status,
      isRequestToBeAdded
    );
    return res.status(response.code).json(response);
  };

  cancel = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { chatId } = req.query;
    const response = await this.taskService.cancelTask(
      id as string,
      chatId as string
    );
    // console.log("response", response);

    return res.status(response.code).json(response);
  };
}

export default TaskController;
