import { FilterQuery } from "mongoose";

import {
  EUserLocationType,
  EUserRole,
  Subscription,
} from "../../database/interfaces/enums";
import { IUser } from "../../database/interfaces/user.interface";
import { ISubscription } from "../../database/interfaces/subscription.interface";
import { UserRepository } from "../repository/user/user.repository";
import { SubscriptionRepository } from "../repository/subscription/subscription.repository";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { ResponseHelper } from "../helpers/reponseapi.helper";

class UserService {
  private userRepository: UserRepository;
  private subscriptionRepository: SubscriptionRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.subscriptionRepository = new SubscriptionRepository();
  }

  getByFilter = async (filter: FilterQuery<IUser>): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.getOne<IUser>(filter);
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

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IUser>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.userRepository.getCount(filter);
      const response = await this.userRepository.getAll<IUser>(
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

  list = async (selectField: string) => {
    try {
      const filter = {
        role: EUserRole.user,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
      };
      const response = await this.userRepository.getAll<IUser>(
        filter,
        undefined,
        selectField
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        role: EUserRole.user,
        _id: _id,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
      };
      const response = await this.userRepository.getOne<IUser>(filter);
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
    dataset: Partial<IUser>
  ): Promise<ApiResponse> => {
    try {
      // checking if subscription is bsp then location should be local
      if (dataset.subscription?.subscription) {
        let subscription =
          await this.subscriptionRepository.getById<ISubscription>(
            dataset.subscription.subscription
          );

        if (
          subscription &&
          subscription.name.toLowerCase() === Subscription.bsl &&
          dataset?.locationType !== EUserLocationType.local
        )
          return ResponseHelper.sendResponse(
            422,
            "Location should be local while subscribing to BSL"
          );
      }

      // checking if location is local then all location details should be provided
      if (
        dataset.locationType &&
        dataset.locationType === EUserLocationType.local &&
        (!dataset.location || !dataset.location.length)
      ) {
        return ResponseHelper.sendResponse(422, "Provide all location details");
      } else if (
        dataset.locationType &&
        dataset.locationType === EUserLocationType.local &&
        dataset.location &&
        dataset.location.length
      ) {
        for (let i = 0; i < dataset.location.length; i++) {
          const element = dataset.location[i];
          if (
            element.coordinates.length < 2 ||
            !element.state ||
            !element.city ||
            !element.county ||
            (dataset.zipCode && !dataset.zipCode.length)
          ) {
            return ResponseHelper.sendResponse(
              422,
              "Provide all location details"
            );
          }
        }
      }

      if (dataset.phoneCode && dataset.phone) {
        dataset.completePhone = dataset.phoneCode + dataset.phone;
      }

      const response = await this.userRepository.updateById<IUser>(
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

  trashIndex = async (page: number, limit = 10): Promise<ApiResponse> => {
    try {
      const filter = {
        role: EUserRole.user,
        $and: [{ deletedAt: { $exists: true } }, { deletedAt: { $ne: null } }],
      };
      const getDocCount = await this.userRepository.getCount(filter);
      const response = await this.userRepository.getAll<IUser>(
        filter,
        "",
        "",
        {
          deletedAt: "desc",
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

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.updateById<IUser>(_id, {
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

export default UserService;
