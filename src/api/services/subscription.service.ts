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
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { IWallet } from "../../database/interfaces/wallet.interface";

class SubscriptionService {
  private userRepository: UserRepository;
  private walletRepository: WalletRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.walletRepository = new WalletRepository();
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
    userId: string
  ): Promise<ApiResponse> => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      console.log("Received payload:", payload);

      const [user, wallet] = await Promise.all([
        this.userRepository.getOne<IUser>({
          _id: new mongoose.Types.ObjectId(userId),
        }),
        this.walletRepository.getOne<IWallet>({
          user: new mongoose.Types.ObjectId(userId),
        }),
      ]);

      if (!user) {
        console.error(`User not found for ID: ${userId}`);
        throw new Error("User not found");
      }

      if (!wallet) {
        console.error(`Wallet not found for user ID: ${userId}`);
        throw new Error("Wallet not found");
      }

      if (wallet.balance < payload.price) {
        console.warn(
          `Insufficient balance for user ID: ${userId}. Balance: ${wallet.balance}, Required: ${payload.price}`
        );
        throw new Error("Insufficient balance");
      }

      const updatedWallet = await this.walletRepository.updateByOne(
        { user: new mongoose.Types.ObjectId(userId) },
        { $inc: { balance: -payload.price } },
        { session }
      );

      if (!updatedWallet) {
        console.error("Failed to update wallet balance");
        throw new Error("Failed to update wallet balance");
      }

      const subscription = await stripeHelper.createSubscriptionItem(
        user.stripeCustomerId as string,
        payload.subscription
      );

      if (!subscription) {
        console.error("Failed to create subscription with Stripe");
        throw new Error("Failed to create subscription");
      }

      console.log("Created subscription:", subscription);

      const updateData = {
        subscription: {
          subscription: payload.subscription,
          plan: payload.plan,
          price: payload.price,
          subscribe: true,
          subscriptionAuthId: subscription.id,
        },
      };

      const updatedUser = await this.userRepository.updateById<IUser>(
        userId,
        { $set: updateData },
        { session }
      );

      if (!updatedUser) {
        console.error(
          `Failed to update user subscription details for user ID: ${userId}`
        );
        throw new Error("Failed to update user subscription details");
      }

      await session.commitTransaction();
      return ResponseHelper.sendResponse(
        201,
        "Subscription created successfully"
      );
    } catch (error) {
      await session.abortTransaction();
      // console.error('Error creating subscription:', error);
      return ResponseHelper.sendResponse(500, (error as Error).message);
    } finally {
      session.endSession();
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
