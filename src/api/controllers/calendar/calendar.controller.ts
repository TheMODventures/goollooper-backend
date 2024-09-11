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
      isActive: true, // this will only fetch those task which are active if the task is completed it will also turn this flag to false
    };
    if (typeof date === "string" && date.trim() !== "") {
      filter.date = moment(date).format("YYYY-MM-DD");
    } else {
      filter.date = moment().format("YYYY-MM-DD"); // Use the current date if 'date' is not a valid string
    }

    console.log("filter", filter);

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
