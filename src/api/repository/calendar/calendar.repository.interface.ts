import {
  ICalendar,
  ICalendarDoc,
} from "../../../database/interfaces/calendar.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ICalendarRepository
  extends IBaseRepository<ICalendar, ICalendarDoc> {}
