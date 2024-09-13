import { Request, Response } from "express";
import { FilterQuery, mongo } from "mongoose";

import { ICalendar } from "../../../database/interfaces/calendar.interface";
import CalendarService from "../../services/calendar.service";
import moment from "moment";

class CalendarController {
  protected calendarService: CalendarService;

  constructor() {
    this.calendarService = new CalendarService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, date = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<ICalendar> = {
      user: req.locals.auth?.userId,
      isDeleted: false,
      isActive: true,
    };
    if (date !== "") filter.date = date;

    const response = await this.calendarService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ICalendar = { ...req.body };
    const response = await this.calendarService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.calendarService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<ICalendar> = { ...req.body };

    const response = await this.calendarService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.calendarService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default CalendarController;
