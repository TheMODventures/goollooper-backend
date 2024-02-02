import mongoose, { FilterQuery } from "mongoose";

import {
  IWallet,
  IWalletDoc,
} from "../../../database/interfaces/wallet.interface";
import { Wallet } from "../../../database/models/wallet.model";
import { BaseRepository } from "../base.repository";
import { IWalletRepository } from "./wallet.repository.interface";

export class WalletRepository
  extends BaseRepository<IWallet, IWalletDoc>
  implements IWalletRepository
{
  constructor() {
    super(Wallet);
  }

  getOneByFilter = async (filter: FilterQuery<IWallet>) => {
    const response = await this.model.findOne<IWallet>(filter);
    return response;
  };

  updateBalance = async (user: string, amount: number) => {
    return await this.model.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(user),
      },
      { $inc: { balance: amount } },
      { new: true }
    );
  };
}
