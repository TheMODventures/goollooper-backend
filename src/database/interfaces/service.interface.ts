import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { ServiceType } from "./enums";

export interface IService extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  type: ServiceType;
  isDeleted?: boolean;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ISubService extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
}

export interface IServiceDoc extends IService, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
