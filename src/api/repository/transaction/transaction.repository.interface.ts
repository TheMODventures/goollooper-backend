import {
  ITransaction,
  ITransactionDoc,
} from "../../../database/interfaces/transaction.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ITransactionRepository
  extends IBaseRepository<ITransaction, ITransactionDoc> {}
