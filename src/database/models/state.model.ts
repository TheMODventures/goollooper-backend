import mongoose, { Schema } from "mongoose";

import { IStateDoc } from "../interfaces/state.interface";

const schemaOptions = {
  timestamps: true,
};

const stateModel: Schema = new Schema(
  {
    name: String,
  },
  schemaOptions
);

stateModel.index({ _id: 1, name: 1, isPublish: 1 });

export const State = mongoose.model<IStateDoc>("State", stateModel);
