import { Request } from "express";
import mongoose, { FilterQuery } from "mongoose";
import _ from "lodash";

import { ResponseHelper } from "../helpers/reponseapi.helper";
import {
  MEGA_BLAST_FEE,
  REQUEST_ADDED_FEE,
  SERVICE_INITIATION_FEE,
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { TaskRepository } from "../repository/task/task.repository";
import { GolistRepository } from "../repository/golist/golist.repository";
import { CalendarRepository } from "../repository/calendar/calendar.repository";
import { ChatRepository } from "../repository/chat/chat.repository";
import { UserRepository } from "../repository/user/user.repository";
import {
  GoList,
  ITask,
  ITaskPayload,
} from "../../database/interfaces/task.interface";
import { IGolist } from "../../database/interfaces/golist.interface";
import {
  ECALENDARTaskType,
  ENOTIFICATION_TYPES,
  ETaskStatus,
  ETaskUserStatus,
  TaskType,
} from "../../database/interfaces/enums";
import { ICalendar } from "../../database/interfaces/calendar.interface";
import { IUser } from "../../database/interfaces/user.interface";
import { UploadHelper } from "../helpers/upload.helper";
import { ModelHelper } from "../helpers/model.helper";
import NotificationService, {
  NotificationParams,
} from "./notification.service";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { IWallet } from "../../database/interfaces/wallet.interface";
import { stripeHelper } from "../helpers/stripe.helper";
import { log } from "console";

class TaskService {
  private taskRepository: TaskRepository;
  private golistRepository: GolistRepository;
  private calendarRepository: CalendarRepository;
  private notificationService: NotificationService;
  private uploadHelper: UploadHelper;
  private chatRepository: ChatRepository;
  private userRepository: UserRepository;
  private userWalletRepository: WalletRepository;
  constructor() {
    this.taskRepository = new TaskRepository();
    this.golistRepository = new GolistRepository();
    this.calendarRepository = new CalendarRepository();
    this.chatRepository = new ChatRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
    this.userWalletRepository = new WalletRepository();
    this.uploadHelper = new UploadHelper("task");
  }

  getCount = async (filter?: FilterQuery<ITask>): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.taskRepository.getCount(filter);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        getDocCount.toString()
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  index = async (
    taskInterests: string[],
    user: string,
    page: number,
    limit: number,
    title?: string
  ): Promise<ApiResponse> => {
    try {
      const match: any = {
        postedBy: { $ne: new mongoose.Types.ObjectId(user) },
      };
      match.isDeleted = false;
      if (taskInterests?.length > 0)
        match.taskInterests = {
          $in: taskInterests.map((e) => new mongoose.Types.ObjectId(e)),
        };
      if (title) {
        match.title = { $regex: title, $options: "i" };
      }
      const query = [
        {
          $match: match,
        },
        {
          $lookup: {
            from: "users",
            localField: "postedBy",
            foreignField: "_id",
            as: "postedBy",
            pipeline: [
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  username: 1,
                  email: 1,
                  profileImage: 1,
                  ratingCount: 1,
                  averageRating: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "taskInterests",
            foreignField: "_id",
            as: "taskInterests",
            pipeline: [
              {
                $project: {
                  title: 1,
                  type: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$postedBy",
        },
      ];
      const data = await this.taskRepository.getAllWithAggregatePagination(
        query,
        undefined,
        undefined,
        { createdAt: -1 },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_LIST_PASSED, data);
    } catch (err) {
      return ResponseHelper.sendResponse(500, (err as Error).message);
    }
  };

  myTasks = async (
    page: number,
    limit: number,
    type: string,
    user: string
  ): Promise<ApiResponse> => {
    try {
      const match: any = { isDeleted: false };
      const userId = new mongoose.Types.ObjectId(user);
      if (type === "accepted") {
        match["goList.serviceProviders.user"] = userId;
      } else {
        match.postedBy = { $eq: userId };
      }

      const data = await this.taskRepository.getAllWithPagination(
        match,
        undefined,
        undefined,
        { createdAt: -1 },
        [
          ModelHelper.populateData("postedBy", ModelHelper.userSelect, "Users"),
          ModelHelper.populateData("taskInterests", "title type", "Service"),
        ],
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_LIST_PASSED, data);
    } catch (err) {
      return ResponseHelper.sendResponse(500, (err as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
        isDeleted: false,
      };
      const response = await this.taskRepository.getOne<ITask>(filter, "", "", [
        ModelHelper.populateData(
          "serviceProviders.user",
          ModelHelper.userSelect,
          "Users"
        ),
        ModelHelper.populateData(
          "goList.taskInterests",
          "title type parent",
          "Service"
        ),
        ModelHelper.populateData("postedBy", ModelHelper.userSelect, "Users"),
        ModelHelper.populateData("users.user", ModelHelper.userSelect, "Users"),
      ]);
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

  create = async (
    payload: ITaskPayload,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      const userId = req?.locals?.auth?.userId!;
      payload.postedBy = userId;

      const wallet = await this.userWalletRepository.getOne<IWallet>({
        user: userId,
      });

      // Helper function to handle wallet errors
      const handleWalletErrors = (wallet: IWallet | null, type: TaskType) => {
        if (type === TaskType.megablast) {
          if (!wallet) {
            return ResponseHelper.sendResponse(404, "Wallet not found");
          }
          // added service initiation fee and + 10 for mega blast package creation
          if (wallet.balance < MEGA_BLAST_FEE) {
            return ResponseHelper.sendResponse(
              400, // bad request
              "Insufficient balance, can't create Mega Blast task"
            );
          }
        }
        return null;
      };

      // Check wallet errors
      const walletError = handleWalletErrors(wallet, payload.type);
      if (walletError) return walletError;

      // file uploading
      if (
        req &&
        _.isArray(req.files) &&
        req.files?.length &&
        req.files?.find((file) => file.fieldname === "media")
      ) {
        const image = req.files?.filter((file) => file.fieldname === "media");
        let path = await this.uploadHelper.uploadFileFromBuffer(image);
        payload.media = path[0];
      }

      if (payload.myList?.length && !payload.goList)
        return ResponseHelper.sendResponse(422, "Provide golist");

      if (payload.myList?.length) {
        await this.golistRepository.updateById(payload.goList as string, {
          $addToSet: {
            serviceProviders: { $each: payload.myList },
          },
        });
      }

      if (payload.type !== TaskType.megablast) {
        const goList: IGolist | null = await this.golistRepository.getById(
          payload.goList as string
        );
        if (!goList)
          return ResponseHelper.sendResponse(404, "GoList not found");
        payload.goList = {
          goListId: payload.goList as string,
          title: goList.title,
          taskInterests: goList.taskInterests,
        };

        (payload.serviceProviders = payload.goListServiceProviders?.map(
          (user) => ({
            user: user as mongoose.Types.ObjectId,
            status: ETaskUserStatus.IDLE,
          })
        )),
          (payload.idleCount = payload.serviceProviders.length);
      }

      if (payload.subTasks?.length) {
        for (let i = 0; i < payload.subTasks.length; i++) {
          const element = payload.subTasks[i];
          if (
            req &&
            _.isArray(req.files) &&
            req.files.length &&
            req.files?.find(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            )
          ) {
            const image = req.files?.filter(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            );

            let path: any = await this.uploadHelper.uploadFileFromBuffer(image);
            element.media = path[0];
          }
        }
      }
      const data = await this.taskRepository.create<ITask>(payload);

      if (
        payload.type === TaskType.megablast &&
        payload.taskInterests?.length
      ) {
        let users = await this.userRepository.getAll({
          volunteer: { $in: payload.taskInterests },
        });
        users?.map(async (user: any) => {
          // when task created it wont add to users calender only notification will be send
          await this.calendarRepository.create({
            user: user?._id,
            task: data._id,
            date: data.date,
          } as ICalendar);

          await this.notificationService.createAndSendNotification({
            senderId: payload.postedBy,
            receiverId: user?._id,
            type: ENOTIFICATION_TYPES.ANNOUNCEMENT,
            data: { task: data?._id?.toString() },
            ntitle: "Volunteer Work",
            nbody: payload.title,
          } as NotificationParams);
        });
      }
      if (
        payload.type !== TaskType.megablast &&
        payload.goListServiceProviders.length
      ) {
        payload.goListServiceProviders.map(async (user: any) => {
          await this.notificationService.createAndSendNotification({
            senderId: payload.postedBy,
            receiverId: user,
            type: ENOTIFICATION_TYPES.TASK_REQUEST,
            data: { task: data?._id?.toString() },
            ntitle: "Task Request",
            nbody: payload.title,
          } as NotificationParams);
        });
      }
      // in from data boolean value come in string format
      if (String(payload.commercial) == "true" && wallet) {
        if (wallet?.balance < SERVICE_INITIATION_FEE) {
          return ResponseHelper.sendResponse(
            400,
            "Insufficient balance, can't create task "
          );
        }
        await this.userWalletRepository.updateById(wallet?._id as string, {
          $inc: {
            balance: -SERVICE_INITIATION_FEE,
            amountHeld: +SERVICE_INITIATION_FEE,
          },
        });
      }

      await this.calendarRepository.create({
        user: payload.postedBy as string,
        task: data._id,
        date: data.date,
      } as ICalendar);

      if (payload.type === TaskType.megablast) {
        const user = await this.userRepository.getById<IUser>(payload.postedBy);
        await this.userWalletRepository.updateById(wallet?._id as string, {
          $inc: { balance: -MEGA_BLAST_FEE },
          // amount will be send to Goolloper wallet later
        });
        console.log(
          "🚀 ~ file: task.service.ts ~ line 393 ~ TaskService ~ create ~ user",
          user
        );
        console.log(
          "🚀 ~ file: task.service.ts ~ line 394 ~ TaskService ~ create ~ GOOLLOOPER_ID",
          process.env.STRIPE_GOOLLOOPER_ID
        );

        const transfer = await stripeHelper.transfer(
          {
            amount: MEGA_BLAST_FEE * 100,
            currency: "usd",
            destination: process.env.STRIPE_GOOLLOOPER_ID as string,
          },
          user?.stripeConnectId as string
        );

        console.log(
          "🚀 ~ file: task.service.ts ~ line 404 ~ TaskService ~ create ~ transfer",
          transfer
        );
      }
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      console.log(error);
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string,
    dataset: Partial<ITaskPayload>,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      let taskResponse = await this.taskRepository.getOne<ITask>({
        _id: _id,
      });

      if (
        req &&
        _.isArray(req.files) &&
        req.files?.length &&
        req.files?.find((file) => file.fieldname === "media")
      ) {
        const image = req.files?.filter((file) => file.fieldname === "media");
        let path = await this.uploadHelper.uploadFileFromBuffer(image);
        dataset.media = path[0];
      }

      if (dataset?.media && taskResponse?.media) {
        this.uploadHelper.deleteFile(taskResponse?.media);
      }

      if (dataset.myList?.length && !dataset.goList)
        return ResponseHelper.sendResponse(422, "Provide golist");

      if (dataset.myList?.length) {
        await this.golistRepository.updateById(dataset.goList as string, {
          $addToSet: {
            serviceProviders: { $each: dataset.myList },
          },
        });
      }

      if (dataset.goList) {
        const goList: IGolist | null = await this.golistRepository.getById(
          dataset.goList as string
        );
        if (!goList)
          return ResponseHelper.sendResponse(404, "GoList not found");
        dataset.goList = {
          goListId: dataset.goList as string,
          title: goList.title,
          taskInterests: goList.taskInterests,
        };
      }

      if (dataset.subTasks?.length) {
        for (let i = 0; i < dataset.subTasks.length; i++) {
          const element = dataset.subTasks[i];
          if (
            req &&
            _.isArray(req.files) &&
            req.files.length &&
            req.files?.find(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            )
          ) {
            const image = req.files?.filter(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            );

            let path: any = await this.uploadHelper.uploadFileFromBuffer(image);
            element.media = path[0];
          }
        }
      }

      let response = await this.taskRepository.updateById<ITask>(_id, dataset);
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      if (
        taskResponse?.type === TaskType.event &&
        dataset.date &&
        taskResponse.date !== dataset.date
      )
        await this.calendarRepository.updateMany({ task: response._id }, {
          date: response.date,
        } as ICalendar);

      if (dataset?.date) {
        await this.calendarRepository.updateMany({ task: response._id }, {
          date: response.date,
        } as ICalendar);
      }

      let chat = await this.chatRepository.getOne(
        { task: _id as string },
        "",
        "groupName chatType participants createdBy"
      );

      let mergedResult = { response, chat };

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        mergedResult
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string, chatId: string): Promise<ApiResponse> => {
    try {
      // Start update operations concurrently
      const [taskUpdate, chatUpdate] = await Promise.all([
        this.taskRepository.updateById<ITask>(_id, { isDeleted: true }),
        this.chatRepository.updateById(chatId, { deleted: true }),
      ]);

      if (!taskUpdate) {
        return ResponseHelper.sendResponse(404, "Task not found");
      }

      // Delete related calendar entries
      await this.calendarRepository.deleteMany({ task: taskUpdate._id });

      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      console.error("Error deleting task and chat:", error);
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  requestToAdded = async (_id: string, user: string) => {
    try {
      const [isUserExistInTask, wallet] = await Promise.all([
        this.taskRepository.exists({
          _id: new mongoose.Types.ObjectId(_id),
          "users.user": new mongoose.Types.ObjectId(user),
        }),
        this.userWalletRepository.getOne<IWallet>({ user }),
      ]);

      if (isUserExistInTask)
        return ResponseHelper.sendResponse(422, "You are already in this task");

      if (!wallet) {
        return ResponseHelper.sendResponse(404, "Wallet not found");
      }

      if (wallet.balance < REQUEST_ADDED_FEE) {
        return ResponseHelper.sendResponse(
          400,
          "Insufficient balance, can't request to be added in task"
        );
      }

      // Fetch user details
      const findUser = await this.userRepository.getById<IUser>(
        user,
        "stripeConnectId firstName"
      );
      if (!findUser) return ResponseHelper.sendResponse(404, "User not found");

      // Execute the transfer and update wallet balance in parallel
      const [transfer] = await Promise.all([
        stripeHelper.transfer(
          {
            amount: REQUEST_ADDED_FEE * 100,
            currency: "usd",
            destination: process.env.STRIPE_GOOLLOOPER_ID as string,
          },
          findUser.stripeConnectId as string
        ),

        this.userWalletRepository.updateById(wallet._id as string, {
          $inc: { balance: -REQUEST_ADDED_FEE },
        }),
      ]);

      const response: ITask | null = await this.taskRepository.updateById(_id, {
        $addToSet: { users: { user } },
        $inc: { pendingCount: 1 },
      });

      if (!response) return ResponseHelper.sendResponse(404);

      await this.notificationService.createAndSendNotification({
        senderId: user,
        receiverId: response.postedBy,
        type: ENOTIFICATION_TYPES.TASK_REQUEST,
        data: { task: _id },
        ntitle: "Task Request",
        nbody: `${findUser.firstName} has requested to be added to the task`,
      } as NotificationParams);

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  toggleRequest = async (
    _id: string,
    loggedInUser: string,
    user: string,
    status: number
  ) => {
    try {
      const isExist = await this.taskRepository.exists({
        _id: new mongoose.Types.ObjectId(_id),
        serviceProviders: {
          $elemMatch: { user: new mongoose.Types.ObjectId(user), status },
        },
      });

      if (isExist)
        return ResponseHelper.sendResponse(422, `Status is already ${status}`);

      const task = await this.taskRepository.getById<ITask>(_id);

      if (!task) {
        return ResponseHelper.sendResponse(404, "Task not found");
      }
      const updateCount: any = { $inc: {} };

      const noOfServiceProvider = task?.noOfServiceProvider;
      const acceptedProvidersCount = task?.serviceProviders.filter(
        (provider) => provider.status === 4
      ).length;

      if (
        status === ETaskUserStatus.ACCEPTED &&
        acceptedProvidersCount >= noOfServiceProvider
      ) {
        // If the number of needed service providers is full, put the new service provider on standby
        status = 3; // Set status to standby
        // Do not increase the accepted count, handle only standby count
      } else if (status === ETaskUserStatus.ACCEPTED) {
        // If the service provider can be accepted, increase the accepted count
        updateCount["$inc"].acceptedCount = 1;
      }

      if (status === ETaskUserStatus.REJECTED) {
        updateCount["$inc"].idleCount = -1;
      } else if (status === ETaskUserStatus.ACCEPTED || status === 3) {
        // Status 3 is for standby
        updateCount["$inc"].idleCount = -1;
      }

      let response = await this.taskRepository.updateByOne<ITask>(
        { _id: new mongoose.Types.ObjectId(_id) },
        {
          $set: { "serviceProviders.$[providers].status": status },
          ...updateCount,
        },
        {
          arrayFilters: [
            { "providers.user": new mongoose.Types.ObjectId(user) },
          ],
        }
      );

      let userData: IUser | null = await this.userRepository.getById(
        user,
        undefined,
        "firstName"
      );
      let chatId;
      if (response && status == ETaskUserStatus.ACCEPTED) {
        // for none commercial event will be created on after accepting
        if (!response.commercial) {
          await this.calendarRepository.create({
            user,
            task: response._id,
            date: response.date ?? "2024-11-11",
            type: ECALENDARTaskType.accepted,
          } as ICalendar);
        }

        this.notificationService.createAndSendNotification({
          senderId: user,
          receiverId: response.postedBy,
          type: ENOTIFICATION_TYPES.TASK_ACCEPTED,
          data: { task: response._id?.toString() },
          ntitle: "Task Accepted",
          nbody: `${userData?.firstName} accepted your task request`,
        } as NotificationParams);
        chatId = await this.chatRepository.addChatForTask({
          user: response?.postedBy,
          task: _id as string,
          participant: user,
          groupName: response?.title,
          noOfServiceProvider: response.noOfServiceProvider,
        });
      } else if (response && status == ETaskUserStatus.REJECTED) {
        await this.calendarRepository.deleteMany({
          user: new mongoose.Types.ObjectId(user),
          task: response._id,
        });
        this.notificationService.createAndSendNotification({
          senderId: user,
          receiverId: response.postedBy,
          type: ENOTIFICATION_TYPES.TASK_REJECTED,
          data: { task: response._id?.toString() },
          ntitle: "Task Rejected",
          nbody: `${userData?.firstName} rejected your task request`,
        } as NotificationParams);
      }

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_UPDATION_PASSED, {
        response,
        chat: chatId,
      });
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  cancelTask = async (id: string) => {
    try {
      // Update the task status to cancelled
      const response = await this.taskRepository.updateById<ITask>(id, {
        status: ETaskStatus.cancelled,
        populate: ["serviceProviders.user"],
      });

      // Handle cases where the task is already cancelled
      if (!response) return ResponseHelper.sendResponse(404, "Task not found");

      if (response.status === ETaskStatus.cancelled)
        return ResponseHelper.sendResponse(400, "Task is already cancelled");

      // Ensure the task is commercial
      if (!response.commercial)
        return ResponseHelper.sendResponse(400, "Task is not commercial");

      // Retrieve the service provider and wallets
      const serviceProvider = response.serviceProviders?.[0]?.user;

      if (!serviceProvider) {
        return ResponseHelper.sendResponse(404, "Service provider not found");
      }

      const [userWallet, serviceProviderWallet] = await Promise.all([
        this.userWalletRepository.getOne<IWallet>({ user: response.postedBy }),
        this.userWalletRepository.getOne<IWallet>({ user: serviceProvider }),
      ]);

      if (!userWallet)
        return ResponseHelper.sendResponse(404, "User wallet not found");

      if (!serviceProviderWallet)
        return ResponseHelper.sendResponse(
          404,
          "Service provider wallet not found"
        );

      // Update the wallets' balances
      await Promise.all([
        this.userWalletRepository.updateById(userWallet._id as string, {
          $inc: { amountHeld: -SERVICE_INITIATION_FEE },
        }),
        this.userWalletRepository.updateById(
          serviceProviderWallet._id as string,
          {
            $inc: { balance: SERVICE_INITIATION_FEE },
          }
        ),
      ]);

      // Return a successful response
      return ResponseHelper.sendSuccessResponse(
        "Task cancelled successfully",
        response
      );
    } catch (error) {
      // Handle and log any errors that occur
      console.error("Error cancelling task:", error);
      return ResponseHelper.sendResponse(
        500,
        `Failed to cancel task: ${(error as Error).message}`
      );
    }
  };
}

export default TaskService;
