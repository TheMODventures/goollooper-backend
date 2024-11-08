import mongoose, { Schema } from "mongoose";

import { IScheduleDoc } from "../interfaces/schedule.interface";
import { Days } from "../interfaces/enums";

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

const scheduleModel: Schema = new Schema(
  {
    day: { type: String, enum: Object.values(Days) },
    startTime: {
      type: String,
      required: true,
      validate: [timeValidator, "Invalid start time"],
    },
    endTime: {
      type: String,
      required: true,
      validate: [timeValidator, "Invalid end time"],
    },
    dayOff: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

scheduleModel.index({ _id: 1, user: 1 });

export const Schedule = mongoose.model<IScheduleDoc>(
  "Schedules",
  scheduleModel
);
