import mongoose from "mongoose";
import { Moment } from "moment";

export interface ICalendar {
  _id?: mongoose.Types.ObjectId | string;
  date: string;
  isActive?: boolean;
  user: string | mongoose.Types.ObjectId;
  type?: string;
  task: string | mongoose.Types.ObjectId;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ICalendarDoc extends ICalendar, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
