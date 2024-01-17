import mongoose, { Schema } from "mongoose";

import { IGuidelineDoc } from "../interfaces/guideline.interface";
import { EGUIDELINE } from "../interfaces/enums";

const schemaOptions = {
  timestamps: true,
  versionKey: false,
};

const guidelineModel: Schema = new Schema(
  {
    type: { type: Number, enum: EGUIDELINE, required: true },
    title: { type: String },
    content: { type: String, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  schemaOptions
);

guidelineModel.index({ _id: 1, name: 1, isPublish: 1 });

export const Guideline = mongoose.model<IGuidelineDoc>(
  "Guideline",
  guidelineModel
);
