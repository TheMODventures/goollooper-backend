import mongoose, { Schema } from "mongoose";

import { EUserRole } from "../interfaces/enums";
import { ITokenDoc } from "../interfaces/token.interface";

const schemaOptions = {
  timestamps: true,
};

const tokenModel: Schema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: Number,
      required: true,
      enum: EUserRole,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  schemaOptions
);

tokenModel.index({ _id: 1, userId: 1, userRole: 1, refreshToken: 1 });

export const Token = mongoose.model<ITokenDoc>("Tokens", tokenModel);
