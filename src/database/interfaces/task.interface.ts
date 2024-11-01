import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { ETaskStatus, ETaskUserStatus, TaskType } from "./enums";

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

export interface GoList {
  title: string;
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
  day?: string;
  applicationEndDate?: string;
  slot: Slot;
  noOfServiceProvider: number;
  media: string;
  commercial?: boolean;
  type: TaskType;
  taskInterests: string[];
  goList: GoList | string;
  myList: string[];
  subTasks: SubTask[];
  postedBy: string;
  gender?: string;
  ageFrom?: number;
  ageTo?: number;
  pendingCount?: number;
  idleCount?: number;
  acceptedCount?: number;
  status?: ETaskStatus;
  serviceProviders: {
    user: mongoose.Types.ObjectId | string;
    status: ETaskUserStatus;
  }[];
  invoiceAmount?: number;
  endDate?: Date | Moment;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
  isDeleted?: boolean;
}

export interface ITaskPayload {
  _id?: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  location: Location;
  requirement: string;
  date: string;
  day?: string;
  slot: Slot;
  noOfServiceProvider: number;
  media: string;
  commercial?: boolean;
  type: TaskType;
  taskInterests: string[];
  goList: GoList | string;
  goListServiceProviders: string[] | mongoose.Types.ObjectId[];
  myList: string[];
  subTasks: SubTask[];
  postedBy: string;
  isDeleted?: boolean;
  gender?: string;
  ageFrom?: number;
  idleCount?: number;
  ageTo?: number;
  serviceProviders: {
    user: mongoose.Types.ObjectId;
    status: ETaskUserStatus;
  }[];
  pendingCount?: number;
  flag: boolean;
  acceptedCount?: number;
  status?: ETaskStatus;
  endDate?: Date | Moment;
}

export interface ITaskDoc extends ITask, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
