import { FilterQuery, ObjectId, PopulateOptions } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import {
  IMultipleNotification,
  INotification,
} from "../../database/interfaces/notification.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { NotificationRepository } from "../repository/notification/notification.repository";
import { UserRepository } from "../repository/user/user.repository";
import { IUser } from "../../database/interfaces/user.interface";
import {
  ENOTIFICATION_TYPES,
  EUserRole,
} from "../../database/interfaces/enums";
import { NotificationHelper } from "../helpers/notification.helper";

class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  index = async (
    page: number,
    limit = 20,
    filter: FilterQuery<INotification>,
    populate?: PopulateOptions | (PopulateOptions | string)[]
  ): Promise<ApiResponse> => {
    try {
      // const getDocCount = await this.notificationRepository.getCount(filter);
      const response =
        await this.notificationRepository.getAllWithPagination<INotification>(
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

  create = async (payload: INotification): Promise<ApiResponse> => {
    try {
      const data = await this.notificationRepository.create<INotification>(
        payload
      );
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  createAndSendNotificationMultiple = async (
    payload: IMultipleNotification,
    userId: string
  ): Promise<ApiResponse> => {
    try {
      if (payload.all) {
        const users = await this.userRepository.getAll(
          {
            isDeleted: false,
            $or: [
              { role: EUserRole.user },
              { role: EUserRole.serviceProvider },
            ],
          },
          undefined,
          "fcmTokens"
        );
        users.forEach(async (user: any) => {
          await this.notificationRepository.create<INotification>({
            ...payload,
            receiver: user._id,
            sender: userId,
            type: ENOTIFICATION_TYPES.ANNOUNCEMENT,
          });
          if (user?.fcmTokens && user.fcmTokens.length)
            NotificationHelper.sendNotification({
              title: payload.title,
              tokens: user?.fcmTokens,
              body: payload.content,
            });
        });
      } else if (payload.receiver?.length) {
        const users = await this.userRepository.getAll(
          { email: payload.receiver },
          undefined,
          "fcmTokens"
        );
        users.forEach(async (user: any) => {
          await this.notificationRepository.create<INotification>({
            ...payload,
            receiver: user._id,
            sender: userId,
            type: ENOTIFICATION_TYPES.ANNOUNCEMENT,
          });
          if (user?.fcmTokens && user.fcmTokens.length)
            NotificationHelper.sendNotification({
              title: payload.title,
              tokens: user?.fcmTokens,
              body: payload.content,
            });
        });
      }
      return ResponseHelper.sendResponse(201, "Successfully sent");
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
      };
      const response = await this.notificationRepository.getOne<INotification>(
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
    dataset: Partial<INotification>
  ): Promise<ApiResponse> => {
    try {
      const response =
        await this.notificationRepository.updateById<INotification>(
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
      const response = await this.notificationRepository.delete<INotification>({
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

  createAndSendNotification = async ({
    sender,
    senderId,
    receiverId,
    type,
    data,
    nbody,
    ntitle,
  }: NotificationParams) => {
    let body: string = "",
      title: string = "";

    const { fcmTokens, firstName, username, lastName }: any =
      await this.userRepository.getById(
        receiverId.toString(),
        undefined,
        "fcmTokens firstName username lastName"
      );
    if (!sender && senderId)
      sender = await this.userRepository.getById(
        senderId.toString(),
        undefined,
        "fcmTokens firstName username lastName"
      );
    console.log("fcmToken from notification model >>> ", fcmTokens);

    switch (type) {
      case ENOTIFICATION_TYPES.MESSAGE_REQUEST:
        title = ntitle ?? `#sender`;
        body = nbody ?? `sends you a message request`;
        break;

      case ENOTIFICATION_TYPES.MESSAGE_REQUEST_ACCEPT:
        title = ntitle ?? `#sender`;
        body = nbody ?? `You accepted #sender's message request`;
        break;

      case ENOTIFICATION_TYPES.TASK_ACCEPTED:
        title = ntitle ?? `#sender`;
        body = nbody ?? `#sender accepted your task request`;
        break;

      case ENOTIFICATION_TYPES.TASK_REJECTED:
        title = ntitle ?? `#sender`;
        body = nbody ?? `#sender rejected your task request`;
        break;

      case ENOTIFICATION_TYPES.TASK_REQUEST:
        title = ntitle ?? `#sender`;
        body = nbody ?? `#sender has requested to be added to the task`;
        break;

      default:
        break;
    }

    const n = {
      receiver: receiverId as string | ObjectId,
      sender: sender?._id as string | ObjectId,
      type: type as number,
      content: body as string,
      title: title as string,
      data,
    } as INotification;
    const notification = await this.notificationRepository.create(n);

    NotificationHelper.sendNotification({
      title,
      body,
      tokens: fcmTokens,
      data,
    });

    return notification;
  };
}

export interface NotificationParams {
  sender: IUser | null;
  senderId: string | ObjectId;
  receiverId: string | ObjectId;
  type: number;
  data: any;
  nbody?: string;
  ntitle?: string;
}

export default NotificationService;
