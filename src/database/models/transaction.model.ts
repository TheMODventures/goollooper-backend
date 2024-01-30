import mongoose, { Schema } from "mongoose";

import { TransactionType } from "../interfaces/enums";
import { ITransactionDoc } from "../interfaces/transaction.interface";

const schemaOptions = {
  timestamps: true,
};

const transactionModel: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
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
