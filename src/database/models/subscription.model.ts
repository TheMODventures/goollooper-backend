import mongoose, { Schema } from "mongoose";

import { SubscriptionType } from "../interfaces/enums";
import { ISubscriptionDoc } from "../interfaces/subscription.interface";

const schemaOptions = {
  timestamps: true,
};

const subscriptionModel: Schema = new Schema(
  {
    name: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    plans: [
      {
        price: { type: String, required: true },
        duration: {
          type: String,
          enum: Object.values(SubscriptionType),
          default: SubscriptionType.day,
        },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  schemaOptions
);

subscriptionModel.index({ _id: 1, name: 1, isPublish: 1 });

export const Subscription = mongoose.model<ISubscriptionDoc>(
  "Subscription",
  subscriptionModel
);
