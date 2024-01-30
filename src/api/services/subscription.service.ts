import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_INSERTION_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import {
  ISubscription,
  IPlans,
} from "../../database/interfaces/subscription.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { SubscriptionRepository } from "../repository/subscription/subscription.repository";

class SubscriptionService {
  private subcriptionRepository: SubscriptionRepository;

  constructor() {
    this.subcriptionRepository = new SubscriptionRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<ISubscription>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.subcriptionRepository.getCount(filter);
      const response = await this.subcriptionRepository.getAll<ISubscription>(
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

  create = async (payload: ISubscription): Promise<ApiResponse> => {
    try {
      const data = await this.subcriptionRepository.create<ISubscription>(
        payload
      );
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
      const response = await this.subcriptionRepository.getOne<ISubscription>(
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
    dataset: Partial<ISubscription>
  ): Promise<ApiResponse> => {
    try {
      const response =
        await this.subcriptionRepository.updateById<ISubscription>(
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
      const response =
        await this.subcriptionRepository.updateById<ISubscription>(_id, {
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

  addPlan = async (
    _id: string,
    dataset: Partial<IPlans>
  ): Promise<ApiResponse> => {
    try {
      const response =
        await this.subcriptionRepository.subDocAction<ISubscription>(
          { _id },
          { $push: { plans: dataset } },
          { new: true }
        );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_INSERTION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  updatePlan = async (
    subscriptionId: string,
    _id: string,
    dataset: Partial<IPlans>
  ): Promise<ApiResponse> => {
    try {
      const updateFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(dataset)) {
        updateFields[`plans.$.${key}`] = value;
      }
      const response =
        await this.subcriptionRepository.subDocAction<ISubscription>(
          { _id: subscriptionId, "plans._id": _id },
          { $set: updateFields }
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

  removePlan = async (
    subscriptionId: string,
    _id: string
  ): Promise<ApiResponse> => {
    try {
      const response =
        await this.subcriptionRepository.subDocAction<ISubscription>(
          { _id: subscriptionId, "plans._id": _id },
          { $pull: { plans: { _id } } }
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

export default SubscriptionService;
