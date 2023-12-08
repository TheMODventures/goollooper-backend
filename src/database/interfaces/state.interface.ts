import mongoose from "mongoose";
import { Moment } from "moment";

export interface IState extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface IStateDoc extends IState, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
