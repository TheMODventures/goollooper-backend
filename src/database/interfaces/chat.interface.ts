import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReceivedBy {
  user: string | Types.ObjectId;
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
  deleted: boolean;
  deletedAt?: Date;
}

export interface IMessage {
  body: string;
  createdAt: Date;
  mediaUrls: string[];
  mediaType: string;
  sentBy: string | Types.ObjectId;
  receivedBy: IReceivedBy[];
  deleted: boolean;
  deletedAt?: Date;
}

export interface IParticipant {
  user: string | Types.ObjectId;
  status: string;
  isMuted: boolean;
  isBlocked: boolean;
}

export interface IChat extends Document {
  groupName?: string;
  isChatSupport: boolean;
  isTicketClosed: boolean;
  groupImageUrl?: string;
  chatType: "group" | "one-to-one";
  createdBy?: string | Types.ObjectId;
  messages: IMessage[];
  lastUpdatedAt: Date;
  participants: IParticipant[];
  deleted: boolean;
  deletedAt?: Date;
}

export interface IChatDoc extends IChat, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
