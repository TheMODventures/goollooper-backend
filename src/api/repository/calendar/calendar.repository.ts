import mongoose from "mongoose";

import {
  ICalendar,
  ICalendarDoc,
} from "../../../database/interfaces/calendar.interface";
import { Calendar } from "../../../database/models/calendar.model";
import { BaseRepository } from "../base.repository";
import { ICalendarRepository } from "./calendar.repository.interface";

export class CalendarRepository
  extends BaseRepository<ICalendar, ICalendarDoc>
  implements ICalendarRepository
{
  constructor() {
    super(Calendar);
  }
}
