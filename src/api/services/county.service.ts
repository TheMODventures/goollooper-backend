import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import { ICounty } from "../../database/interfaces/county.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { CountyRepository } from "../repository/county/county.repository";

class CountyService {
  private countyRepository: CountyRepository;

  constructor() {
    this.countyRepository = new CountyRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<ICounty>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.countyRepository.getCount(filter);
      const response = await this.countyRepository.getAll<ICounty>(
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

  create = async (payload: ICounty): Promise<ApiResponse> => {
    try {
      const data = await this.countyRepository.create<ICounty>(payload);
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
      const response = await this.countyRepository.getOne<ICounty>(filter);
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
    _id: string,
    dataset: Partial<ICounty>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.countyRepository.updateById<ICounty>(
        _id,
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
      const response = await this.countyRepository.delete<ICounty>({ _id });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default CountyService;
