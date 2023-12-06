import {
  IGolist,
  IGolistDoc,
} from "../../database/interfaces/golist.interface";
import { GolistRepository } from "../repository/golist/golist.repository";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_INSERTION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { FilterQuery, PopulateOptions } from "mongoose";

class GolistService {
  private golistRepository: GolistRepository;

  constructor() {
    this.golistRepository = new GolistRepository();
  }
  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IGolist>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.golistRepository.getCount(filter);
      const response = await this.golistRepository.getAll<IGolist>(
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

  create = async (payload: IGolist): Promise<ApiResponse> => {
    try {
      const data = await this.golistRepository.create<IGolist>(payload);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_INSERTION_PASSED,
        data
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (
    _id: string,
    populate?: PopulateOptions | (PopulateOptions | string)[]
  ): Promise<ApiResponse> => {
    try {
      const filter = {
        _id: _id,
      };
      const response = await this.golistRepository.getOne<IGolist>(
        filter,
        undefined,
        undefined,
        populate
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
    dataset: Partial<IGolist>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.golistRepository.updateByOne<IGolist>(
        { _id, createdBy: dataset.createdBy },
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
      const response = await this.golistRepository.updateById<IGolist>(_id, {
        isDeleted: true,
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

export default GolistService;
