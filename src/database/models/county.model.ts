import mongoose, { Schema } from "mongoose";

import { ICountyDoc } from "../interfaces/county.interface";

const schemaOptions = {
  timestamps: true,
};

const countyModel: Schema = new Schema(
  {
    name: String,
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
  },
  schemaOptions
);

countyModel.index({ _id: 1, name: 1, isPublish: 1 });

export const County = mongoose.model<ICountyDoc>("County", countyModel);
