import mongoose from "mongoose";
import { Moment } from "moment";
import { EGUIDELINE } from "./enums";

export interface IGuideline extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  type: EGUIDELINE;
  content: string;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface IGuidelineDoc extends IGuideline, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
