import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import ScheduleService from "../../services/schedule.service";
import { ISchedule } from "../../../database/interfaces/schedule.interface";

class ScheduleController {
  protected scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<ISchedule> = {
      user: req.locals.auth?.userId,
      isDeleted: false,
    };
    const response = await this.scheduleService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ISchedule = { ...req.body };
    const userId = req?.locals?.auth?.userId!;
    const response = await this.scheduleService.create(payload, userId);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.scheduleService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<ISchedule> = { ...req.body };

    const response = await this.scheduleService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.scheduleService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default ScheduleController;
