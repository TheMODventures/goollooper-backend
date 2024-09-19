import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { IWorkerDoc } from "../interfaces/worker.interface";
const { Schema } = mongoose;

const workerSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      required: true,
      default: null,
    },
    employer: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

workerSchema.plugin(mongoosePaginate);
workerSchema.plugin(aggregatePaginate);

export const Worker = mongoose.model<IWorkerDoc>("Worker", workerSchema);
