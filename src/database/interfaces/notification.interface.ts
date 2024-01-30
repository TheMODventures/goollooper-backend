import mongoose, { ObjectId } from "mongoose";

export interface INotification {
  receiver: string | ObjectId;
  sender: string | ObjectId;
  type: number;
  content: string;
  title: string;
  isRead: boolean;
  data?: any;
}

export interface IMultipleNotification {
  title: string;
  content: string;
  receiver?: string[];
  sender?: string | ObjectId;
  type: number;
  all?: boolean;
  isRead: boolean;
  data?: any;
}

export interface INotificationDoc extends INotification, Document {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
