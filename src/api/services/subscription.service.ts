import mongoose from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
} from "../../constant";
import { ISubscription } from "../../database/interfaces/subscription.interface";
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
        return ResponseHelper.sendResponse(404, "User not found");
      }

      if (!wallet) {
        console.error(`Wallet not found for user ID: ${userId}`);
        return ResponseHelper.sendResponse(404, "Wallet not found");
      }

      if (wallet.balance < payload.price) {
        console.warn(
          `Insufficient balance for user ID: ${userId}. Balance: ${wallet.balance}, Required: ${payload.price}`
        );
        return ResponseHelper.sendResponse(
          400,
          "Insufficient balance in wallet"
        );
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
        { $inc: { balance: -payload.price } },
        { session }
      );

      if (!updatedWallet) {
        console.error("Failed to update wallet balance");
        throw new Error("Failed to update wallet balance");
      }

      const updateData = {
        subscription: {
          subscription: payload.subscription,
          plan: payload.plan,
          name: payload.name,
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

      const transaction = await this.transactionRepository.create(
        {
          user: userId,
          amount: payload.price,
          type: TransactionType.subscription,
          status: ETransactionStatus.completed,
          isCredit: false,
          subscription: subscription.id,
          wallet: wallet._id as string,
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
