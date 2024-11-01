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
import SocketIO from "socket.io";

import {
  ENOTIFICATION_TYPES,
  EUserRole,
} from "../../database/interfaces/enums";
import { NotificationHelper } from "../helpers/notification.helper";
import { Authorize } from "../../middleware/authorize.middleware";
import { Server } from "socket.io";

interface CustomSocket extends SocketIO.Socket {
  user?: any;
}

export const notificationSockets = (io: SocketIO.Server) => {
  // console.log("Notification Socket Initialized");
  // const authorize = new Authorize();
  // const notificationService = new NotificationService(io as Server);
  // io.use(async (socket: CustomSocket, next) => {
  //   const token = socket.handshake.query.token;
  //   const result = await authorize.validateAuthSocket(token as string);
  //   if (result?.userId) {
  //     socket.user = result;
  //     next();
  //   } else next(new Error(result));
  // });
  // io.on("connection", async (socket: CustomSocket) => {
  //   console.log(socket.user?.userId, "socket user");
  //   // const result = await authorize.validateAuthSocket(token as string);
  //   const count = await notificationService.getNotificationCount(
  //     socket?.user?.userId
  //   );
  //   console.log("Notification Count: ", count);
  //   io.emit("notification-event", count);
  //   console.log(`Socket Connected: ${socket.id}`);
  //   console.log(`User Connected: ${socket.user?.userId}`);
  // });
};

class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;
  private io?: Server;
  constructor(io?: Server) {
    this.io = io;
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

  update = async (dataset: Partial<INotification>): Promise<ApiResponse> => {
    try {
      const response =
        await this.notificationRepository.updateMany<INotification>(
          { receiver: dataset.receiver, isRead: false },
          { isRead: true }
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
    // console.log("fcmToken from notification model >>> ", fcmTokens);

    switch (type) {
      case ENOTIFICATION_TYPES.MESSAGE_REQUEST:
        title = ntitle ?? `#sender`;
        body = nbody ?? `sends you a message request`;
        break;

      case ENOTIFICATION_TYPES.MESSAGE_REQUEST_ACCEPT:
        title = ntitle ?? `#sender`;
        body = nbody ?? `You accepted #sender's message request`;
        break;

      case ENOTIFICATION_TYPES.ANNOUNCEMENT:
        title = ntitle ?? `New Announcement`;
        body = nbody ?? `Task request`;
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
      case ENOTIFICATION_TYPES.ACTION_REQUEST:
        title = ntitle ?? `#sender`;
        body = nbody ?? `#sender has requested this action`;
      default:
      case ENOTIFICATION_TYPES.TASK_CANCELLED:
        title = ntitle ?? `#sender`;
        body = nbody ?? `#sender has cancelled the task`;
        break;
      case ENOTIFICATION_TYPES.TASK_DELETED:
        title = ntitle ?? `#sender`;
        body = nbody ?? `#sender has deleted the task`;
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

  async getNotificationCount(userId: string) {
    const count = await this.notificationRepository.getCount<INotification>({
      receiver: userId,
      isRead: false,
    });
    return count;
  }
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
