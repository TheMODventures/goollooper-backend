import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { ICalendarDoc } from "../interfaces/calendar.interface";
import { ECALENDARTaskType } from "../interfaces/enums";

const schemaOptions = {
  timestamps: true,
};

const timeValidator = (value: string) => {
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/; // Regular expression for HH:mm format

  if (!regex.test(value)) {
    throw new Error("Invalid time format. Please use HH:mm format.");
  }

  return true;
};

const dateValidator = (value: string) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(value)) {
    throw new Error("Invalid date format. Please use YYYY-MM-DD format.");
  }

  return true;
};

const calendarModel: Schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      default: ECALENDARTaskType.request,
      enum: Object.values(ECALENDARTaskType),
    },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

calendarModel.index({ _id: 1, date: 1 });
calendarModel.plugin(aggregatePaginate);
calendarModel.plugin(mongoosePaginate);

export const Calendar = mongoose.model<ICalendarDoc>("Calendar", calendarModel);
