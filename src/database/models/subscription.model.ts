import mongoose, { Schema } from "mongoose";

import { SubscriptionType } from "../interfaces/enums";
import { ISubscriptionDoc } from "../interfaces/subscription.interface";

const schemaOptions = {
  timestamps: true,
};

const subscriptionModel: Schema = new Schema(
  {
    name: { type: String, required: false },
    tagline: { type: String, required: false },
    description: { type: String, required: false },
    price: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

subscriptionModel.index({ _id: 1, name: 1, isPublish: 1 });

export const Subscription = mongoose.model<ISubscriptionDoc>(
  "Subscription",
  subscriptionModel
);
