import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

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
        ref: "User",
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
golistModel.plugin(mongoosePaginate);
golistModel.plugin(aggregatePaginate);

export const Golist = mongoose.model<IGolistDoc>("Golist", golistModel);
