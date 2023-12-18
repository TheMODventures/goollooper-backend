import mongoose, { Schema } from "mongoose";

import { IGolistDoc } from "../interfaces/golist.interface";
import { EList } from "../interfaces/enums";

const schemaOptions = {
  timestamps: true,
};

const golistModel: Schema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: Number,
      required: true,
      enum: EList,
    },
    serviceProviders: [
      {
        type: Schema.Types.ObjectId,
        required: true,
      },
    ],
    taskInterests: [
      {
        type: Schema.Types.ObjectId,
        // required: true,
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);
golistModel.index({ _id: 1, title: 1 });

export const Golist = mongoose.model<IGolistDoc>("Golist", golistModel);
