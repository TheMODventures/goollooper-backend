import mongoose, { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import { ISchedule } from "../../database/interfaces/schedule.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { ScheduleRepository } from "../repository/schedule/schedule.repository";

class ScheduleService {
  private scheduleRepository: ScheduleRepository;

  constructor() {
    this.scheduleRepository = new ScheduleRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<ISchedule>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.scheduleRepository.getCount(filter);
      const response = await this.scheduleRepository.getAll<ISchedule>(
        filter,
        "",
        "",
        {
          createdAt: "desc",
        },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (payload: ISchedule, userId: string): Promise<ApiResponse> => {
    try {
      let schedule = await this.scheduleRepository.getOne<ISchedule>({
        user: new mongoose.Types.ObjectId(userId),
        day: payload.day,
        isDeleted: false,
      });
      if (schedule) {
        return ResponseHelper.sendResponse(409, "Already created");
      }
      const data = await this.scheduleRepository.create<ISchedule>({
        ...payload,
        user: new mongoose.Types.ObjectId(userId),
      });
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
      };
      const response = await this.scheduleRepository.getOne<ISchedule>(filter);
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

  update = async (
    _id: string | mongoose.Types.ObjectId,
    dataset: Partial<ISchedule>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.scheduleRepository.updateById<ISchedule>(
        _id as string,
        dataset
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.scheduleRepository.updateById<ISchedule>(
        _id,
        {
          isDeleted: true,
        }
      );
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default ScheduleService;
