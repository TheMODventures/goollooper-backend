import mongoose, { FilterQuery, PipelineStage } from "mongoose";

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
    search: string,
    filter: FilterQuery<IService>,
    parent?: string // Optional parent parameter
  ): Promise<ApiResponse> => {
    try {
      const keyWords = search.split(" ").filter(Boolean);
      const pipeline: PipelineStage[] = [];

      pipeline.push({ $match: { isDeleted: false } });
      pipeline.push({ $match: { parent: null } });

      pipeline.push({
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "parent",
          as: "subCategories",
        },
      });

      pipeline.push({
        $addFields: {
          hasSubCategory: { $gt: [{ $size: "$subCategories" }, 0] },
        },
      });

      if (keyWords.length > 0) {
        pipeline.push({
          $match: {
            subCategories: {
              $elemMatch: {
                keyWords: { $in: keyWords },
              },
            },
          },
        });
      }

      pipeline.push({
        $project: {
          subCategories: 1,
          title: 1,
          description: 1,
          hasSubCategory: 1,
        },
      });

      const response =
        await this.serviceRepository.getAllWithAggregatePagination<IService>(
          pipeline,
          "",
          "",
          {
            title: "asc",
          },
          undefined,
          true,
          page,
          limit
        );

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response
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
      const query: PipelineStage[] = [
        { $match: { _id: new mongoose.Types.ObjectId(_id) } },
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
          $unwind: {
            path: "$subServices",
            preserveNullAndEmptyArrays: true,
          },
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
      const response = await this.serviceRepository.getDataByAggregate(query);
      if (!response.length) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        response[0] as any
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
}

export default ServiceService;

// const pipeline: PipelineStage[] = [
//   { $match: filter },
//   {
//     $lookup: {
//       from: "services",
//       localField: "_id",
//       foreignField: "parent",
//       as: "subServices",
//     },
//   },
//   {
//     $addFields: {
//       subServices: {
//         $filter: {
//           input: "$subServices",
//           as: "child",
//           cond: { $ne: ["$$child._id", "$_id"] },
//         },
//       },
//     },
//   },
//   {
//     $unwind: {
//       path: "$subServices",
//       preserveNullAndEmptyArrays: true,
//     },
//   },
//   {
//     $group: {
//       _id: "$_id",
//       title: { $first: "$title" },
//       type: { $first: "$type" },
//       parent: { $first: "$parent" },
//       subServices: { $push: "$subServices" },
//       matchedServices: {
//         $addToSet: {
//           $cond: {
//             if: { $ne: ["$_id", "$subServices._id"] },
//             then: "$_id",
//             else: null,
//           },
//         },
//       },
//     },
//   },
//   {
//     $match: {
//       subServices: { $ne: [] },
//       matchedServices: { $ne: null },
//     },
//   },
//   {
//     $unwind: "$matchedServices",
//   },
//   {
//     $project: {
//       title: 1,
//       type: 1,
//       parent: 1,
//       subServices: {
//         $map: {
//           input: "$subServices",
//           as: "child",
//           in: {
//             _id: "$$child._id",
//             title: "$$child.title",
//             parent: "$$child.parent",
//           },
//         },
//       },
//     },
//   },
//   {
//     $match: {
//       parent: null,
//     },
//   },
// ];
