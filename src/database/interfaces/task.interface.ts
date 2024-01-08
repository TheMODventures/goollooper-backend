import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { TaskType } from "./enums";

interface Location {
  coordinates: [number, number];
  readableLocation?: string;
}

interface Slot {
  startTime: {
    type: string;
  };
  endTime: {
    type: string;
  };
}

interface GoList {
  title: string;
  serviceProviders: mongoose.Types.ObjectId[];
  taskInterests?: mongoose.Types.ObjectId[];
  goListId: string;
}

interface SubTask {
  title: string;
  noOfServiceProvider: number;
  note: string;
  slot: Slot;
  media: string;
}

export interface ITask {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  location: Location;
  requirement: string;
  date: string;
  slot: Slot;
  noOfServiceProvider: number;
  media: string;
  type: TaskType;
  taskInterests: string[];
  goList: GoList | string;
  myList: string[];
  subTasks: SubTask[];
  postedBy: string;
  isDeleted?: boolean;
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
