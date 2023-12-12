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
import UserService from "./user.service";
import { GoogleMapHelper } from "../helpers/googleMapApi.helper";
import { ObjectId } from "bson";

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

  getNearestServiceProviders = async (
    page: number,
    limit = 10,
    userId: string | undefined,
    serviceId: string | ObjectId,
    subscription?: string | ObjectId,
    coordinates?: Number[],
    zipCode?: string | null
  ) => {
    try {
      if (zipCode) {
        // coordinates = []
        const googleCoordinates = (await GoogleMapHelper.searchLocation(
          zipCode,
          ""
        )) as Number[] | null;
        if (!googleCoordinates)
          return ResponseHelper.sendResponse(404, "postal code is invalid");
        coordinates = googleCoordinates;
      }
      const match = {
        _id: { $ne: new ObjectId(userId) },
        isDeleted: false,
        role: 3,
        $or: [
          { "volunteer.service": new ObjectId(serviceId) },
          { "volunteer.subService": new ObjectId(serviceId) },
        ],

        // isActive: true,
        // isVerified: true,
      } as any;
      if (subscription) {
        match["subscription.subscription"] = subscription;
      }
      const users = await new UserService().getDataByAggregate(page, limit, [
        // {
        //   $geoNear: {
        //     near: {
        //       type: "Point",
        //       coordinates: coordinates as [number, number],
        //     },
        //     distanceField: "distance",
        //     spherical: true,
        //     maxDistance: 10000,
        //   },
        // },
        {
          $match: match,
        },
        {
          $lookup: {
            as: "subscription",
            from: "subscriptions",
            localField: "subscription.subscription",
            foreignField: "_id",
          },
        },
        {
          $addFields: {
            subscription: { $first: "$subscription" },
          },
        },
        {
          $project: {
            _id: 1,
            username: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            profileImage: 1,
            subscriptionName: {
              $ifNull: ["$subscription.name", null],
            },
            distance: 1,
          },
        },
      ]);
      return users;
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default GolistService;
