import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { ServiceType } from "./enums";

export interface IService extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  type: ServiceType;
  parent?: mongoose.Types.ObjectId | string;
  isDeleted?: boolean;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface IServiceDoc extends IService, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
