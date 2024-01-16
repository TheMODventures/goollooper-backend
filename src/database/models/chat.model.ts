import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { IChat, IChatDoc } from "../interfaces/chat.interface";
import { Request, RequestStatus, MessageType } from "../interfaces/enums";

const deleteFields = {
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
};

const chatSchema = new Schema(
  {
    groupName: {
      type: String,
      index: true,
      required: function (this: IChat) {
        return this.chatType === "group";
      },
    },
    isChatSupport: {
      type: Boolean,
      default: false,
    },
    isTicketClosed: {
      type: Boolean,
      default: false,
    },
    groupImageUrl: {
      type: String,
    },
    chatType: {
      type: String,
      enum: ["one-to-one", "group"],
      default: "one-to-one",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IChat) {
        return this.chatType === "group";
      },
    },
    messages: [
      {
        body: {
          type: String,
          index: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        mediaUrls: [{ type: String }],
        mediaType: {
          type: String,
        },
        sentBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: function (this: IChat) {
            return this.chatType === "one-to-one";
          },
        },
        receivedBy: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
            status: {
              type: String,
              enum: ["sent", "delivered", "seen"],
              default: "sent",
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
            ...deleteFields,
          },
        ],
        type: {
          type: String,
          enum: MessageType,
          default: MessageType.message,
          required: true,
        },
        ...deleteFields,
      },
    ],
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          default: "active",
        },
        isMuted: {
          type: Boolean,
          default: false,
        },
        isBlocked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    requests: [
      {
        title: { type: String, default: null },
        mediaUrl: { type: String, default: null },
        amount: { type: String, default: null },
        type: {
          type: String,
          enum: Request,
          required: true,
        },
        status: {
          type: String,
          enum: RequestStatus,
          default: null,
        },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    ...deleteFields,
  },
  {
    timestamps: true,
  }
);

chatSchema.plugin(mongoosePaginate);
chatSchema.plugin(aggregatePaginate);

export const Chat = mongoose.model<IChatDoc>("Chat", chatSchema);