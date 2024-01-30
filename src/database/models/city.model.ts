import mongoose, { Schema } from "mongoose";

import { ICityDoc } from "../interfaces/city.interface";

const schemaOptions = {
  timestamps: true,
};

const cityModel: Schema = new Schema(
  {
    name: String,
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
  },
  schemaOptions
);

cityModel.index({ _id: 1, name: 1, isPublish: 1 });

export const City = mongoose.model<ICityDoc>("City", cityModel);
