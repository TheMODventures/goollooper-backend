import mongoose, { Document } from "mongoose";
import { Moment } from "moment";
import { TOPUP_METHOD } from "./enums";

export interface IWallet extends JwtToken {
  _id?: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  balance: number;
  amountHeld: number;
  selectedTopupMethod: TOPUP_METHOD;
}

export enum PaymentIntentType {
  topUp = "top-up",
  subscription = "subscription",
}
export interface IWalletDoc extends IWallet, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
}
