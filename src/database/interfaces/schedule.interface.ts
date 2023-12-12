import mongoose from "mongoose";
import { Moment } from "moment";

import { Days } from "./enums";

export interface ISlot {
  startTime: string;
  endTime: string;
}

export interface ISchedule {
  _id?: mongoose.Types.ObjectId | string;
  date: Date;
  slots: ISlot[];
  day: Days;
  isActive?: boolean;
  user: mongoose.Types.ObjectId;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface IScheduleDoc extends ISchedule, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
