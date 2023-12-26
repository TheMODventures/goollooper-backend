import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { ITaskDoc } from "../interfaces/task.interface";

const schemaOptions = {
  timestamps: true,
};

const taskModel: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    taskInterests: {
      type: [mongoose.Schema.Types.ObjectId], // Assuming taskInterests is an array of strings
      default: [],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming there is a User model to reference
    },
    gender: { type: String, default: null },
    ageFrom: { type: Number, default: null },
    ageTo: { type: Number, default: null },
    endDate: { type: Date, required: true },
    media: { type: [String], default: [] },
  },
  schemaOptions
);

taskModel.index({ _id: 1, title: 1 });
taskModel.plugin(mongoosePaginate);
taskModel.plugin(aggregatePaginate);

export const Task = mongoose.model<ITaskDoc>("Task", taskModel);
