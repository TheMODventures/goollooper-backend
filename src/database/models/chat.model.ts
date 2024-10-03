import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { IChat, IChatDoc } from "../interfaces/chat.interface";
import {
  Request,
  RequestStatus,
  MessageType,
  EChatType,
  EMessageStatus,
  EParticipantStatus,
  ETICKET_STATUS,
} from "../interfaces/enums";

const timeValidator = (value: string) => {
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/; // Regular expression for HH:mm format
  if (!regex.test(value)) {
    throw new Error("Invalid time format. Please use HH:mm format.");
  }
  return true;
};

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
        return this.chatType === EChatType.GROUP;
      },
    },
    ticketStatus: {
      type: String,
      enum: ETICKET_STATUS,
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
      enum: [EChatType.ONE_TO_ONE, EChatType.GROUP],
      default: EChatType.ONE_TO_ONE,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IChat) {
        return this.chatType === EChatType.GROUP;
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
            return this.chatType === EChatType.ONE_TO_ONE;
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
              enum: EMessageStatus,
              default: EMessageStatus.SENT,
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
        requestId: {
          type: Schema.Types.ObjectId,
          default: null,
        },
        workers: [
          {
            type: Schema.Types.ObjectId,
            ref: "Worker",
            default: [],
          },
        ],
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
          required: true,
        },
        status: {
          type: String,
          default: EParticipantStatus.ACTIVE,
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
        date: { type: Date, required: false },
        slot: {
          startTime: {
            type: String,
            required: false,
            validate: [timeValidator, "Invalid start time"],
          },
          endTime: {
            type: String,
            required: false,
            validate: [timeValidator, "Invalid end time"],
          },
        },
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
    workers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Worker",
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
