import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import { IGuideline } from "../../database/interfaces/guideline.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { GuidelineRepository } from "../repository/guideline/guideline.repository";

class GuidelineService {
  private guidelineRepository: GuidelineRepository;

  constructor() {
    this.guidelineRepository = new GuidelineRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IGuideline>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.guidelineRepository.getCount(filter);
      const response = await this.guidelineRepository.getAll<IGuideline>(
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

  create = async (payload: IGuideline): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.guidelineRepository.getCount({
        type: payload.type,
        isDeleted: false,
      });
      if (getDocCount > 0) {
        return ResponseHelper.sendResponse(409, "Already created");
      }
      const data = await this.guidelineRepository.create<IGuideline>(payload);
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
      const response = await this.guidelineRepository.getOne<IGuideline>(
        filter
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

  update = async (
    _id: string,
    dataset: Partial<IGuideline>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.guidelineRepository.updateById<IGuideline>(
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
      const response = await this.guidelineRepository.delete<IGuideline>({
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

export default GuidelineService;
