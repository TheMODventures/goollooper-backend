import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { TaskType } from "./enums";

interface Location {
  coordinates: [number, number];
  readableLocation?: string;
}

interface GoList {
  title: string;
  serviceProviders: mongoose.Types.ObjectId[];
  taskInterests?: mongoose.Types.ObjectId[];
  goListId: string;
}

export interface ITask {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  location: Location;
  requirement: string;
  date: string;
  slot: {
    startTime: {
      type: string;
    };
    endTime: {
      type: string;
    };
  };
  noOfServiceProvider: number;
  media: string;
  type: TaskType;
  taskInterests: string[];
  goList: GoList | string;
  myList: string[];
  postedBy: string;
  isDeleted?: boolean;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ITaskDoc extends ITask, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
