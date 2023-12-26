import mongoose from "mongoose";
import { Moment } from "moment";

interface Location {
  type: string;
  coordinates: [number, number];
  state?: string;
  city?: string;
  county?: string;
  isSelected: boolean;
  readableLocation?: string;
}

export interface ITask extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  taskInterests: string[];
  taskLocation: Location;
  postedBy: string;
  media: string[];
  gender?: string;
  ageFrom?: number;
  ageTo?: number;
  endDate?: Date | Moment;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ITaskDoc extends ITask, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
