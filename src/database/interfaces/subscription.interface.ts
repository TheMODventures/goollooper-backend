import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { SubscriptionType } from "./enums";

export interface ISubscription extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  tagline: string;
  description: string;
  isDeleted?: boolean;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface IPlans extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  price: string;
  duration: SubscriptionType;
}

export interface ISubscriptionDoc extends ISubscription, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
