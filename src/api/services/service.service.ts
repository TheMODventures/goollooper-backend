import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import {
  IService,
  ISubService,
} from "../../database/interfaces/service.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { ServiceRepository } from "../repository/service/service.repository";

class ServiceService {
  private serviceRepository: ServiceRepository;

  constructor() {
    this.serviceRepository = new ServiceRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IService>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.serviceRepository.getCount(filter);
      const response = await this.serviceRepository.getAll<IService>(
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

  create = async (payload: IService): Promise<ApiResponse> => {
    try {
      const data = await this.serviceRepository.create<IService>(payload);
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id: _id,
      };
      const response = await this.serviceRepository.getOne<IService>(filter);
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
    dataset: Partial<IService>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.serviceRepository.updateById<IService>(
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
      const response = await this.serviceRepository.updateById<IService>(_id, {
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

  addSubService = async (
    _id: string,
    dataset: Partial<ISubService>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.serviceRepository.subDocAction<IService>(
        { _id },
        { $push: { subServices: dataset } },
        { new: true }
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendResponse(201, response);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  updateSubService = async (
    serviceId: string,
    _id: string,
    dataset: Partial<ISubService>
  ): Promise<ApiResponse> => {
    try {
      // const updatedValues: Record<string, any> = {};
      // for (let field in dataset) {
      //   updatedValues[`subServices.$.${field}`] = dataset[field];
      // }
      const response = await this.serviceRepository.subDocAction<IService>(
        { _id: serviceId, "subServices._id": _id },
        { $set: { "subServices.$.title": dataset.title } }
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

  removeSubService = async (
    serviceId: string,
    _id: string
  ): Promise<ApiResponse> => {
    try {
      const response = await this.serviceRepository.subDocAction<IService>(
        { _id: serviceId, "subServices._id": _id },
        { $pull: { subServices: { _id } } }
      );
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_DELETION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default ServiceService;
