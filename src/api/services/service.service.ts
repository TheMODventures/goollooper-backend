import mongoose, { FilterQuery, PipelineStage } from "mongoose";

import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import {
  IService,
  IServicePayload,
} from "../../database/interfaces/service.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { ServiceRepository } from "../repository/service/service.repository";
import { ServiceType } from "../../database/interfaces/enums";

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

      pipeline.push({
        $match: { isDeleted: false, parent: null, type: filter.type },
      });

      // Step 2: Lookup for subcategories based on the parent field
      pipeline.push({
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "parent",
          as: "subCategories",
        },
      });

      // Step 3: Add hasSubCategory field based on the size of subCategories
      pipeline.push({
        $addFields: {
          hasSubCategory: { $gt: [{ $size: "$subCategories" }, 0] },
        },
      });

      // Step 4: Filter by keywords if provided
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

      // Step 5: Lookup industry and get only the name
      pipeline.push({
        $lookup: {
          from: "industries",
          localField: "industry",
          foreignField: "_id",
          as: "industry",
        },
      });

      // Step 6: Unwind the industry array
      pipeline.push({
        $unwind: {
          path: "$industry",
          preserveNullAndEmptyArrays: true, // Allow null if no industry is found
        },
      });

      // Step 7: Project only required fields
      pipeline.push({
        $project: {
          title: 1,
          industry: "$industry.name", // Only project the industry name
          industryId: "$industry._id",
          hasSubCategory: 1,
          "subCategories._id": 1,
          "subCategories.title": 1,
          "subCategories.type": 1,
          "subCategories.parent": 1,
          // "subCategories.keyWords": 1,
        },
      });

      if (filter.type == ServiceType.interest) {
        pipeline.push({
          $group: {
            _id: "$industry",
            industry: { $first: "$industry" },
            industryId: { $first: "$industryId" },
            categories: {
              $push: {
                _id: "$_id",
                category: "$title",
                subCategories: "$subCategories",
                hasSubCategory: "$hasSubCategory",
              },
            },
          },
        });
      }

      pipeline.push({
        $sort: { industry: 1 },
      });
      const response =
        await this.serviceRepository.getAllWithAggregatePagination<IService>(
          pipeline,
          "",
          "",
          {
            industry: "asc", // Sort by industry name in ascending order
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
  create = async (
    payload: IServicePayload | IService
  ): Promise<ApiResponse> => {
    try {
      let data;
      if (payload.type == ServiceType.interest)
        data = await this.createCategoryWithSubcategories(
          payload as IServicePayload
        );
      else
        data = await this.serviceRepository.create<IService>(
          payload as IService
        );

      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const page = 1;
      const limit = 50;
      const query: PipelineStage[] = [];

      query.push({ $match: { parent: new mongoose.Types.ObjectId(_id) } });
      query.push({ $match: { isDeleted: false } });

      query.push({
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "parent",
          as: "subCategories",
        },
      });

      query.push({
        $addFields: {
          hasSubCategory: { $gt: [{ $size: "$subCategories" }, 0] },
        },
      });

      query.push({
        $project: {
          title: 1,
          type: 1,
          parent: 1,
          industry: 1,
          isDeleted: 1,
          keyWords: 1,
          hasSubCategory: 1,
        },
      });

      const response =
        await this.serviceRepository.getAllWithAggregatePagination<IService>(
          query,
          "",
          "",
          {
            industry: "asc",
          },
          undefined,
          true,
          page,
          limit
        );

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

  private async createCategoryWithSubcategories(
    category: IServicePayload
  ): Promise<IService> {
    const { subCategories, ...categoryData } = category;

    const createdCategory = await this.serviceRepository.create<IService>(
      categoryData as unknown as IService
    );
    console.log("CATEGORY", createdCategory);
    if (subCategories && subCategories.length > 0) {
      await Promise.all(
        subCategories.map(async (subCategory) => {
          subCategory.parent = createdCategory._id as string;
          return this.createCategoryWithSubcategories(subCategory);
        })
      );
    }
    return createdCategory;
  }
}

export default ServiceService;
