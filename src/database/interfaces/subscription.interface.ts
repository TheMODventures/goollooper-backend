import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { SubscriptionType } from "./enums";

export interface ISubscription extends JwtToken {
  subscription: string;
  name: string;
  plan: string;
  priceId: string;
  price: number;
  subscribe?: boolean;
  subscriptionAuthId?: string;
  expirytime: string;
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
export enum Plans {
  monthly = 30,
  year = 365,
  day = 1,
}
