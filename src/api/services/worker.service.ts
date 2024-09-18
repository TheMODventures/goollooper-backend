import { Request } from "express";
import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_INSERTION_PASSED,
} from "../../constant";
import { IWorker } from "../../database/interfaces/worker.interface";

import { ResponseHelper } from "../helpers/reponseapi.helper";
import { WorkerRepository } from "../repository/worker/worker.repository";

export class WorkerService {
  private workerRepository: WorkerRepository;

  constructor() {
    this.workerRepository = new WorkerRepository();
  }

  index = async (req: Request): Promise<ApiResponse> => {
    try {
      const user = req.locals.auth?.userId;
      const workers = await this.workerRepository.getAll<IWorker>({
        employer: user,
        isDeleted: false,
      });
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        workers
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (payload: IWorker, req: Request): Promise<ApiResponse> => {
    try {
      const getCount = await this.workerRepository.getCount({
        employer: req.locals.auth?.userId,
        isDeleted: false,
      });
      if (getCount >= 10)
        return ResponseHelper.sendResponse(400, "Maximum worker limit reached");
      const worker = await this.workerRepository.create<IWorker>(payload);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_INSERTION_PASSED,
        worker
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    id: string,
    payload: IWorker,
    req: Request
  ): Promise<ApiResponse> => {
    try {
      const worker = await this.workerRepository.updateById<IWorker>(
        id,
        payload
      );
      if (!worker) return ResponseHelper.sendResponse(404, "Worker not found");
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        worker
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (id: string, req: Request): Promise<ApiResponse> => {
    try {
      const worker = await this.workerRepository.updateById(id, {
        isDeleted: true,
      });
      if (!worker) return ResponseHelper.sendResponse(404, "Worker not found");
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_DELETION_PASSED,
        worker
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}
