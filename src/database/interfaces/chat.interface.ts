import mongoose, { Document, Types } from "mongoose";
import {
  EChatType,
  EMessageStatus,
  MessageType,
  Request,
  RequestStatus,
} from "./enums";

export interface IReceivedBy {
  user: string | Types.ObjectId;
  status: EMessageStatus;
  createdAt: Date;
  deleted: boolean;
  deletedAt?: Date;
}

export interface IMessage {
  body: string;
  createdAt?: Date;
  mediaUrls?: string[];
  mediaType?: string;
  sentBy?: string | Types.ObjectId;
  type?: MessageType;
  receivedBy?: IReceivedBy[];
  requestId?: string | Types.ObjectId;
  deleted?: boolean;
  deletedAt?: Date;
}

export interface IParticipant {
  user: string | Types.ObjectId;
  status: string;
  isMuted: boolean;
  isBlocked: boolean;
}

interface Slot {
  startTime: {
    type: string;
  };
  endTime: {
    type: string;
  };
}

export interface IRequest {
  title?: string;
  mediaUrl?: string;
  amount?: string;
  paymentRecipients?: string[];
  date?: Date;
  slot?: Slot;
  type: Request;
  status: RequestStatus;
  createdBy?: string | Types.ObjectId;
  createdAt?: Date;
}

export interface IChat extends Document {
  groupName?: string;
  isChatSupport: boolean;
  isTicketClosed: boolean;
  groupImageUrl?: string;
  chatType: EChatType;
  createdBy?: string | Types.ObjectId;
  messages: IMessage[];
  lastUpdatedAt: Date;
  participants: IParticipant[];
  task: string | Types.ObjectId;
  requests: IRequest[];
  deleted: boolean;
  deletedAt?: Date;
}

export interface IChatPayload {
  groupName?: string;
  isChatSupport?: boolean;
  isTicketClosed?: boolean;
  groupImageUrl?: string;
  chatType?: EChatType;
  createdBy?: string | Types.ObjectId;
  messages?: IMessage[];
  lastUpdatedAt?: Date;
  participant: string | Types.ObjectId;
  task: string | Types.ObjectId;
  user: string | Types.ObjectId;
  noOfServiceProvider: number;
  requests?: IRequest[];
  deleted?: boolean;
  deletedAt?: Date;
}

export interface IChatDoc extends IChat, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatDetailsData {
  userId: string;
  page?: number;
  chatSupport?: boolean;
  chatId?: string;
  search?: string;
}
