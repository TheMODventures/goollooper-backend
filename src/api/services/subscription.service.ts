import mongoose from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
} from "../../constant";
import {
  ISubscription,
  Plans,
} from "../../database/interfaces/subscription.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { stripeHelper } from "../helpers/stripe.helper";
import { UserRepository } from "../repository/user/user.repository";
import { IUser } from "../../database/interfaces/user.interface";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { TransactionRepository } from "../repository/transaction/transaction.repository";
import { IWallet } from "../../database/interfaces/wallet.interface";
import Stripe from "stripe";
import {
  ETransactionStatus,
  TransactionType,
} from "../../database/interfaces/enums";
import { ITransaction } from "../../database/interfaces/transaction.interface";

class SubscriptionService {
  private userRepository: UserRepository;
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  constructor() {
    this.userRepository = new UserRepository();
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
  }

  index = async ({
    unique,
    name,
  }: {
    unique: boolean;
    name?: string;
  }): Promise<ApiResponse> => {
    try {
      const subscription = await stripeHelper.subscriptions();

      if (unique) {
        const uniqueKeys = new Set<string>();
        const descriptions: { [key: string]: string } = {};
        const tagLine: { [key: string]: string } = {};

        if ("data" in subscription) {
          subscription.data.forEach((item: Stripe.Product) => {
            const metadataKeys = Object.keys(item.metadata);
            metadataKeys.forEach((key) => {
              if (
                key === "BSL" ||
                key === "IW" ||
                key === "MBS" ||
                key === "BSP"
              ) {
                uniqueKeys.add(key);
                descriptions[key] = item.description as string;
                tagLine[key] = item.metadata["tagLine"];
              }
            });
          });
        }
        const responseData = Array.from(uniqueKeys).map((key) => ({
          key,
          description: descriptions[key],
          tagLine: tagLine[key],
        }));

        return ResponseHelper.sendSuccessResponse(
          "subscription plan found",
          responseData
        );
      } else if (name) {
        let filteredSubscriptions: Stripe.Product[] = [];

        if ("data" in subscription) {
          filteredSubscriptions = subscription.data.filter(
            (item: Stripe.Product) => item.metadata.hasOwnProperty(name)
          );
        }

        return ResponseHelper.sendSuccessResponse(
          `Subscriptions filtered by metadata key ${name}`,
          filteredSubscriptions
        );
      } else {
        return ResponseHelper.sendResponse(
          422,
          'Invalid request: must provide "unique" or "name" Query Param'
        );
      }
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

      // const dummyPrice = 1; // TODO remove this in production

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
        return ResponseHelper.sendResponse(404, "User not found");
      }

      if (!wallet) {
        console.error(`Wallet not found for user ID: ${userId}`);
        return ResponseHelper.sendResponse(404, "Wallet not found");
      }

      if (wallet.balance < payload.price) {
        // TODO remove this in production
        console.log(
          `Insufficient balance for user ID: ${userId}. Balance: ${payload.price}, Required: ${payload.price}` // TODO remove this in production
        );
        return ResponseHelper.sendResponse(
          400,
          "Insufficient balance in wallet"
        );
      }
      const subscriptionAuthId = user.subscription?.subscriptionAuthId;
      console.log("subscriptionAuthId", subscriptionAuthId);

      if (subscriptionAuthId) {
        await stripeHelper.deleteSubscriptionItem(subscriptionAuthId);

        console.log("Previous subscription deleted successfully");
      }

      const subscription = await stripeHelper.createSubscriptionItem(
        user.stripeCustomerId as string,
        payload.priceId
      );

      if (!subscription) {
        console.error("Failed to create subscription with Stripe");
        throw new Error("Failed to create subscription");
      }

      const updatedWallet = await this.walletRepository.updateByOne(
        { user: new mongoose.Types.ObjectId(userId) },
        { $inc: { balance: -payload.price } }, // TODO remove this in production
        { session }
      );

      if (!updatedWallet) {
        throw new Error("Failed to update wallet balance");
      }

      let expirytime;
      const currentDate = new Date();

      if (payload.plan === "monthly") {
        expirytime = new Date(
          currentDate.getTime() + Plans.monthly * 24 * 60 * 60 * 1000
        ); // Add 30 days
      } else if (payload.plan === "annum") {
        expirytime = new Date(
          currentDate.getTime() + Plans.year * 24 * 60 * 60 * 1000
        ); // Add 365 days
      } else if (payload.plan === "day") {
        expirytime = new Date(
          currentDate.getTime() + Plans.day * 24 * 60 * 60 * 1000
        ); // Add 1 day
      } else {
        throw new Error(`Unsupported plan: ${payload.plan}`);
      }

      const updateData = {
        subscription: {
          subscription: payload.subscription,
          plan: payload.plan,
          name: payload.name,
          price: payload.price,
          subscribe: true,
          priceId: payload.priceId,
          subscriptionAuthId: subscription.id,
          expirytime,
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

      const transaction = await this.transactionRepository.create(
        {
          user: userId,
          amount: payload.price,
          type: TransactionType.subscription,
          status: ETransactionStatus.pending,
          isCredit: false,
          wallet: wallet._id as string,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ITransaction,
        { session }
      );

      if (!transaction) {
        console.error("Failed to create transaction");
        throw new Error("Failed to create transaction");
      }

      await session.commitTransaction();
      return ResponseHelper.sendResponse(
        201,
        "Subscription created successfully"
      );
    } catch (error) {
      console.error("Error creating subscription:", error);
      await session.abortTransaction();
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

  cancel = async (id: string): Promise<ApiResponse> => {
    try {
      const user = await this.userRepository.getById<IUser>(id);
      if (!user) return ResponseHelper.sendResponse(400, "User Does Not Exist");

      if (user.subscription?.subscribe == false)
        return ResponseHelper.sendResponse(400, "subscription does not exist");

      await stripeHelper.createSubscriptionItem(
        user.stripeCustomerId as string,
        user.subscription?.priceId as string
      );

      await this.userRepository.updateById<ISubscription>(id, {
        subscription: {
          subscribe: false,
        },
      });

      return ResponseHelper.sendSuccessResponse("Subscriptions Cancel");
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default SubscriptionService;
