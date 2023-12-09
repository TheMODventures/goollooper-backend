import mongoose from "mongoose";
import { Moment } from "moment";

export interface ICity extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  state: string | mongoose.Types.ObjectId;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ICityDoc extends ICity, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
