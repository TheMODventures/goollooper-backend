import mongoose from "mongoose";

export interface IWorker {
  firstName: string;
  lastName: string;
  profileImage: string;
  employer: string;
  isDeleted: boolean;
}

export interface IWorkerDoc extends IWorker, Document {
  _id?: mongoose.Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}
