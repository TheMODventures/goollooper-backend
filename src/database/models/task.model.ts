import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { ITaskDoc } from "../interfaces/task.interface";
import {
  TaskType,
  ETaskUserStatus,
  ETaskStatus,
  Days,
} from "../interfaces/enums";

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

const taskModel: Schema = new Schema(
  {
    title: { type: String, default: null },
    description: { type: String, default: null },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number, Number] },
      readableLocation: String,
    },
    requirement: { type: String, default: null },
    date: { type: Date, required: true },
    day: { type: String, enum: Days },
    slot: {
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
    },
    noOfServiceProvider: { type: Number, default: 1 },
    media: { type: String },
    commercial: { type: Boolean, default: false },
    type: {
      type: String,
      required: true,
      enum: TaskType,
      default: TaskType.normal,
    },
    taskInterests: [
      { type: Schema.Types.ObjectId, ref: "Service", default: [] },
    ],
    goList: {
      title: { type: String },
      taskInterests: [{ type: Schema.Types.ObjectId, ref: "Service" }],
      goListId: { type: Schema.Types.ObjectId, ref: "Golist" },
    },
    subTasks: [
      {
        title: { type: String },
        noOfServiceProvider: { type: Number },
        note: { type: String, default: null },
        slot: {
          startTime: {
            type: String,
            required: false,
            validate: [timeValidator, "Invalid start time"],
          },
          endTime: {
            type: String,
            required: false,
            validate: [timeValidator, "Invalid end time"],
          },
        },
        media: { type: String },
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gender: { type: String, default: null },
    ageFrom: { type: Number, default: null },
    ageTo: { type: Number, default: null },
    endDate: { type: Date, required: false },
    serviceProviders: {
      type: [
        {
          _id: false,
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          status: {
            type: Number,
            enum: ETaskUserStatus,
          },
        },
      ],
      default: [],
    },
    applicationEndDate: { type: Date },
    pendingCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    idleCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(ETaskStatus),
      default: ETaskStatus.pending,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    invoiceAmount: { type: Number, default: 0 },
  },
  schemaOptions
);

taskModel.index({ _id: 1, title: 1 });
taskModel.plugin(mongoosePaginate);
taskModel.plugin(aggregatePaginate);

export const Task = mongoose.model<ITaskDoc>("Task", taskModel);
