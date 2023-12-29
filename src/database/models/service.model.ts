import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { ServiceType } from "../interfaces/enums";
import { IServiceDoc } from "../interfaces/service.interface";

const schemaOptions = {
  timestamps: true,
};

const serviceModel: Schema = new Schema(
  {
    title: { type: String, default: null },
    type: {
      type: String,
      enum: Object.values(ServiceType),
      default: ServiceType.volunteer,
    },
    parent: { type: Schema.Types.ObjectId, ref: "Service", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

serviceModel.plugin(mongoosePaginate);
serviceModel.plugin(aggregatePaginate);

export const Service = mongoose.model<IServiceDoc>("Service", serviceModel);
