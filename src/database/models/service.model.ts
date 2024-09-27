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
    industry: { type: Schema.Types.ObjectId, ref: "Industry", default: null },
    parent: { type: Schema.Types.ObjectId, ref: "Service", default: null },
    keyWords: {
      type: [String],
      default: [],
    },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

serviceModel.pre("save", function (next) {
  if (this.keyWords && Array.isArray(this.keyWords)) {
    this.keyWords = this.keyWords.map((keyword) => keyword.toLowerCase());
  }
  next();
});

serviceModel.index(
  { parent: 1 },
  { partialFilterExpression: { parent: { $exists: true, $ne: null } } }
);
serviceModel.plugin(mongoosePaginate);
serviceModel.plugin(aggregatePaginate);

export const Service = mongoose.model<IServiceDoc>("Service", serviceModel);
