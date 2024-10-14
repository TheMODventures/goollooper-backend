import { FilterQuery, PopulateOptions } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import {
  IRating,
  RatingPayload,
} from "../../database/interfaces/rating.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { RatingRepository } from "../repository/rating/rating.repository";
import { UserRepository } from "../repository/user/user.repository";
import { IUser } from "../../database/interfaces/user.interface";

class RatingService {
  private ratingRepository: RatingRepository;
  private userRepository: UserRepository;

  constructor() {
    this.ratingRepository = new RatingRepository();
    this.userRepository = new UserRepository();
  }

  index = async (
    page: number,
    limit = 20,
    filter: FilterQuery<IRating>,
    populate?: PopulateOptions | (PopulateOptions | string)[]
  ): Promise<ApiResponse> => {
    try {
      // const getDocCount = await this.ratingRepository.getCount(filter);
      const response =
        await this.ratingRepository.getAllWithPagination<IRating>(
          filter,
          "",
          "",
          {
            createdAt: "desc",
          },
          populate,
          true,
          page,
          limit
        );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        response.pagination.totalItems
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
  create = async (payload: IRating): Promise<ApiResponse> => {
    try {
      const user = await this.userRepository.getById<IUser>(
        payload.to as string
      );
      if (!user) return ResponseHelper.sendResponse(404, "User not found");
      const isRatingExist = await this.ratingRepository.getOne<IRating>({
        by: payload.by,
        to: payload.to,
        task: payload.task,
      });

      if (isRatingExist)
        return ResponseHelper.sendResponse(
          400,
          "Rating Already has been given"
        );

      const updatedRatingCount = user.ratingCount + 1;
      const updatedAverageRating =
        (user.averageRating * user.ratingCount + payload.star) /
        updatedRatingCount;

      await this.userRepository.updateById(user._id as string, {
        averageRating: updatedAverageRating,
        ratingCount: updatedRatingCount,
      });

      const data = await this.ratingRepository.create<IRating>(payload);
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  createMultiple = async (payload: RatingPayload): Promise<ApiResponse> => {
    try {
      const reviews: IRating[] = [];

      const isRatingExist = await this.ratingRepository.getOne<IRating>({
        by: payload.by,
        task: payload.task,
      });

      if (isRatingExist)
        return ResponseHelper.sendResponse(
          400,
          "You have already rated this user"
        );

      const userUpdates: {
        userId: string;
        updateData: { averageRating: number; ratingCount: number };
      }[] = [];

      await Promise.all(
        payload.to.map(async (userId) => {
          userId = userId.toString();
          const user = await this.userRepository.getById<IUser>(userId);
          if (!user) return;

          const updatedRatingCount = user.ratingCount + 1;
          const updatedAverageRating =
            (user.averageRating * user.ratingCount + payload.star) /
            updatedRatingCount;

          userUpdates.push({
            userId: user._id as string,
            updateData: {
              averageRating: updatedAverageRating,
              ratingCount: updatedRatingCount,
            },
          });

          reviews.push({
            star: payload.star,
            description: payload.description || "",
            by: payload.by,
            to: userId,
            task: payload.task,
          } as IRating);
        })
      );

      const data = await this.ratingRepository.createMany<IRating>(reviews);

      await Promise.all(
        userUpdates.map(({ userId, updateData }) =>
          this.userRepository.updateById(userId, updateData)
        )
      );

      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
      };
      const response = await this.ratingRepository.getOne<IRating>(filter);
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
    dataset: Partial<IRating>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.ratingRepository.updateById<IRating>(
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
      const response = await this.ratingRepository.delete<IRating>({
        _id,
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

export default RatingService;
