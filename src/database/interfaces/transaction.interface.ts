import mongoose, { Document } from "mongoose";
import { Moment } from "moment";

import { TransactionType } from "./enums";

export interface ITransaction extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  amount: number;
  type: TransactionType;
  task?: mongoose.Types.ObjectId | string;
  subscription?: mongoose.Types.ObjectId | string;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}

export interface ITransactionDoc extends ITransaction, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}