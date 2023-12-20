import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

export interface IGolist extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  title: string;
  serviceProviders: mongoose.Types.ObjectId[];
  taskInterests?: mongoose.Types.ObjectId[];
  isDeleted?: boolean;
  type: Number;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
  deletedAt?: Date | Moment | null;
}

export interface IGolistDoc extends IGolist, Document {
  _id?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
