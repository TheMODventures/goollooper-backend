import {
  ITransaction,
  ITransactionDoc,
} from "../../../database/interfaces/transaction.interface";
import { Transaction } from "../../../database/models/transaction.model";
import { BaseRepository } from "../base.repository";
import { ITransactionRepository } from "./transaction.repository.interface";

export class TransactionRepository
  extends BaseRepository<ITransaction, ITransactionDoc>
  implements ITransactionRepository
{
  constructor() {
    super(Transaction);
  }
}
