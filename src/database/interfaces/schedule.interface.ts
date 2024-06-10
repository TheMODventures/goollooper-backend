import mongoose from "mongoose";
import { Moment } from "moment";

import { Days } from "./enums";

export interface ISchedule {
  _id?: mongoose.Types.ObjectId | string;
  day: Days;
  startTime: string;
  endTime: string;
  user: mongoose.Types.ObjectId;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
  isDeleted?: boolean;
}

export interface IScheduleDoc extends ISchedule, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
