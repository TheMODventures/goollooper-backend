import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { NOTIFICATION_TYPES } from "../interfaces/enums";
import { INotificationDoc } from "../interfaces/notification.interface";

const schemaOptions = {
  timestamps: true,
};
const notificationModel: Schema = new Schema(
  {
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: Number,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    content: { type: String, required: true },
    title: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    data: {
      type: { serviceProvider: { type: Schema.Types.ObjectId, ref: "User" } },
      default: null,
    },
  },
  schemaOptions
);

notificationModel.plugin(mongoosePaginate);
notificationModel.plugin(aggregatePaginate);

notificationModel.index({ _id: 1, receiver: 1, sender: 1 });
export const Notification = model<INotificationDoc>(
  "Notification",
  notificationModel
);
