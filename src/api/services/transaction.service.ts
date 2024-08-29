import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import {
  ITransaction,
  ITransactionDoc,
} from "../../database/interfaces/transaction.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { TransactionRepository } from "../repository/transaction/transaction.repository";

class TransactionService {
  private transactionRepository: TransactionRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<ITransaction>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.transactionRepository.getCount(filter);

      const response = await this.transactionRepository.getAll<ITransactionDoc>(
        filter,
        "",
        "",
        {
          createdAt: "desc",
        },
        undefined,
        false,
        page,
        limit
      );

      if (response.length === 0) {
        return ResponseHelper.sendResponse(404, "No data found");
      }

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
      };
      const response = await this.transactionRepository.getOne<ITransaction>(
        filter,
        undefined,
        undefined,
        [
          {
            path: "user",
            model: "Users",
            select: "firstName lastName userName email",
          },
          {
            path: "task",
            model: "Task",
            select: "title",
          },
        ]
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (payload: ITransaction): Promise<ApiResponse> => {
    try {
      const data = await this.transactionRepository.create<ITransactionDoc>(
        payload
      );
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.transactionRepository.delete<ITransaction>({
        _id,
      });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default TransactionService;
