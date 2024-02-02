import {
  IWallet,
  IWalletDoc,
} from "../../../database/interfaces/wallet.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IWalletRepository
  extends IBaseRepository<IWallet, IWalletDoc> {}
