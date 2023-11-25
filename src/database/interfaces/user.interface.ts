import { Moment } from "moment";
import mongoose, { Document } from "mongoose";

import { EUserRole } from "./enums";

export interface IUser {
  _id?: string | mongoose.Types.ObjectId;
  role: EUserRole;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password?: string;

  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
  deletedAt?: Date | Moment | null;
  bannedAt?: Date | Moment | null;
  isBanned: boolean;
}

export interface IUserDoc extends IUser, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
