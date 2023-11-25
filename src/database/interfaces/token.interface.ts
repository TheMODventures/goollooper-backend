import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { EUserRole } from "./enums";

export interface IToken extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  role: EUserRole;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ITokenDoc extends IToken, Document {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
