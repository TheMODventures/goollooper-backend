import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";

import TransactionService from "../../services/transaction.service";
import { ITransaction } from "../../../database/interfaces/transaction.interface";

class TransactionController {
  protected transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, type = "", user } = req.query;
    const limitNow = limit ? limit : 10;

    let filter: FilterQuery<ITransaction> = {};
    // console.log(req.locals.auth?.userId);

    if (type) {
      filter = {
        type: type,
      };
    }

    if (user) filter = { ...filter, user: user as string };
    // const userId = new mongoose.Types.ObjectId(user as string);
    // if(user) filter = { ...filter,user: userId }

    const response = await this.transactionService.index(
      Number(page),
      Number(limitNow),
      filter
    );

    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.transactionService.show(id);
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ITransaction = { ...req.body };
    const response = await this.transactionService.create(payload);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<ITransaction> = { ...req.body };

    const response = await this.transactionService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.transactionService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default TransactionController;
