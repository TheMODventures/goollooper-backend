import mongoose, { ObjectId } from "mongoose";

export interface INotification extends JwtToken {
  receiver: string | ObjectId;
  sender: string | ObjectId;
  type: number;
  content: string;
  title: string;
  isRead: boolean;
  data?: any;
}

export interface INotificationDoc extends INotification, Document {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
