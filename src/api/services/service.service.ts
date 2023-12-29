import { FilterQuery, PipelineStage } from "mongoose";

import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { IService } from "../../database/interfaces/service.interface";
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
      const pipeline: PipelineStage[] = [
        { $match: filter },
        {
          $lookup: {
            from: "services",
            localField: "_id",
            foreignField: "parent",
            as: "subServices",
          },
        },
        {
          $addFields: {
            subServices: {
              $filter: {
                input: "$subServices",
                as: "child",
                cond: { $ne: ["$$child._id", "$_id"] },
              },
            },
          },
        },
        {
          $unwind: "$subServices",
        },
        {
          $group: {
            _id: "$_id",
            title: { $first: "$title" },
            type: { $first: "$type" },
            subServices: { $push: "$subServices" },
            matchedServices: {
              $addToSet: {
                $cond: {
                  if: { $ne: ["$_id", "$subServices._id"] },
                  then: "$_id",
                  else: null,
                },
              },
            },
          },
        },
        {
          $unwind: "$matchedServices",
        },
        {
          $match: {
            matchedServices: { $ne: null },
          },
        },
        {
          $project: {
            title: 1,
            type: 1,
            subServices: {
              $map: {
                input: "$subServices",
                as: "child",
                in: {
                  _id: "$$child._id",
                  title: "$$child.title",
                  parent: "$$child.parent",
                },
              },
            },
          },
        },
      ];

      const response =
        await this.serviceRepository.getAllWithAggregatePagination<IService>(
          pipeline,
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

  // populateAllData = async (
  //   payload: { title: string; type: string; subServices: string[] }[]
  // ) => {
  //   try {
  //     for (let i = 0; i < payload?.length; i++) {
  //       let element = payload[i];
  //       const exists = await this.serviceRepository.getOne<IService>({
  //         title: element?.title,
  //         type: element?.type,
  //       });
  //       let data: IService | null = exists;

  //       // if service not exists create
  //       if (!exists) {
  //         const payloadObj: any = {
  //           title: element?.title,
  //           type: element?.type,
  //         };
  //         data = await this.serviceRepository.create<IService>(payloadObj);
  //       }

  //       element?.subServices?.forEach(async (field: any) => {
  //         const subServiceExists =
  //           await this.serviceRepository.getOne<IService>({
  //             title: field?.title,
  //             type: element?.type,
  //           });
  //         if (!subServiceExists) {
  //           const cityPayload: any = {
  //             title: field?.title,
  //             type: element?.type,
  //             parent: data?._id,
  //           };
  //           this.serviceRepository.create<IService>(cityPayload);
  //         }
  //       });
  //     }
  //     return ResponseHelper.sendResponse(201);
  //   } catch (error) {
  //     return ResponseHelper.sendResponse(500, (error as Error).message);
  //   }
  // };
}

export default ServiceService;
