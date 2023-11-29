import mongoose, { Schema } from "mongoose";

import { ServiceType } from "../interfaces/enums";
import { IServiceDoc } from "../interfaces/service.interface";

const schemaOptions = {
  timestamps: true,
};

const serviceModel: Schema = new Schema(
  {
    title: { type: String, default: null },
    subServices: [
      {
        title: { type: String, default: null },
      },
    ],
    type: {
      type: String,
      enum: Object.values(ServiceType),
      default: ServiceType.volunteer,
    },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

serviceModel.index({ _id: 1, name: 1, isPublish: 1 });

export const Service = mongoose.model<IServiceDoc>("Service", serviceModel);
