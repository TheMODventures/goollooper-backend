import mongoose, { FilterQuery } from "mongoose";

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
import { stripeHelper } from "../helpers/stripe.helper";
import { UserRepository } from "../repository/user/user.repository";
import { IUser } from "../../database/interfaces/user.interface";

class SubscriptionService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }

  index = async (): Promise<ApiResponse> => {
    try {
      const subscription = await stripeHelper.subscriptions();
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        subscription
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (
    payload: ISubscription,
    user: string
  ): Promise<ApiResponse> => {
    try {
      console.log(payload, "Payload");
      // const data = await this.userRepository.updateById<IUser>(
      //   user,
      //   payload
      // );

      return ResponseHelper.sendResponse(
        201,
        "Subscription created successfully"
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (id: string): Promise<ApiResponse> => {
    try {
      const subscription = await stripeHelper.subscriptions(id);

      console.log(subscription, "Subscription");

      if (!subscription) {
        return ResponseHelper.sendResponse(404, "Subscription not found");
      }

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        subscription
      );
    } catch (error) {
      console.log(error, "Error");

      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default SubscriptionService;
