import mongoose, { Schema } from "mongoose";
import { IIndustryDoc } from "../interfaces/industry.interface";

const schemaOptions = {
  timestamps: true,
  versionKey: false,
};

const industrySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

industrySchema.index(
  { name: 1, _id: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $eq: false } },
  }
);

export const Industry = mongoose.model<IIndustryDoc>(
  "Industry",
  industrySchema
);
