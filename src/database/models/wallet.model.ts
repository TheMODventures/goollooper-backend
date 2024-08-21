import mongoose, { Schema } from "mongoose";

import { IWalletDoc } from "../interfaces/wallet.interface";
import { TOPUP_METHOD } from "../interfaces/enums";

const schemaOptions = {
  timestamps: true,
};

const walletModel: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    balance: { type: Number, default: 0, positive: true },
    amountHeld: { type: Number, required: true, default: 0, positive: true }, // amount held for a task
    selectedTopupMethod: {
      type: String,
      enum: TOPUP_METHOD,
      default: TOPUP_METHOD.CARD,
    },
    lastPayoutRequest: {
      type: Date,
      default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  schemaOptions
);

export const Wallet = mongoose.model<IWalletDoc>("Wallet", walletModel);
