import mongoose, { Schema } from "mongoose";

import { ETransactionStatus, TransactionType } from "../interfaces/enums";
import { ITransactionDoc } from "../interfaces/transaction.interface";

const schemaOptions = {
  timestamps: true,
};

const transactionModel: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet" },

    amount: { type: Number, required: true, positive: true, default: 0 },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    status: {
      type: String,
      enum: ETransactionStatus,
      default: ETransactionStatus.pending,
    },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
  },
  schemaOptions
);

export const Transaction = mongoose.model<ITransactionDoc>(
  "Transaction",
  transactionModel
);
