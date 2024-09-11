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
  ETransactionStatus,
  TaskType,
  TransactionType,
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
import { TransactionRepository } from "../repository/transaction/transaction.repository";
import { ITransaction } from "../../database/interfaces/transaction.interface";
import { IChatDoc } from "../../database/interfaces/chat.interface";
import { ChatService } from "./chat.service";

class TaskService {
  private taskRepository: TaskRepository;
  private golistRepository: GolistRepository;
  private calendarRepository: CalendarRepository;
  private notificationService: NotificationService;
  private uploadHelper: UploadHelper;
  private chatRepository: ChatRepository;
  private userRepository: UserRepository;
  private transactionRepository: TransactionRepository;
  private chatService: ChatService;
  private userWalletRepository: WalletRepository;
  constructor() {
    this.taskRepository = new TaskRepository();
    this.golistRepository = new GolistRepository();
    this.calendarRepository = new CalendarRepository();
    this.chatRepository = new ChatRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();
    this.userWalletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.chatService = new ChatService();
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
        if (payload.commercial) {
          if (!wallet) {
            return ResponseHelper.sendResponse(404, "Wallet not found");
          }
          if (wallet.balance < SERVICE_INITIATION_FEE) {
            return ResponseHelper.sendResponse(
              400,
              "Insufficient balance, can't create task "
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
      if (!data) return ResponseHelper.sendResponse(400, "Task not created");

      if (
        payload.type === TaskType.megablast &&
        payload.taskInterests?.length
      ) {
        // Fetch users based on task interests, excluding the user who created the task
        let users = await this.userRepository.getAll<IUser>({
          volunteer: { $in: payload.taskInterests },
          _id: { $ne: payload.postedBy }, // Exclude the task creator
        });

        if (users?.length) {
          // Process notifications, calendar entries, and task updates concurrently
          await Promise.all(
            users.map(async (user: any) => {
              // Add task to user's calendar
              const calendarPromise = this.calendarRepository.create({
                user: user._id,
                task: data._id,
                date: data.date,
              } as ICalendar);

              // Send notification
              const notificationPromise =
                this.notificationService.createAndSendNotification({
                  senderId: payload.postedBy,
                  receiverId: user._id,
                  type: ENOTIFICATION_TYPES.ANNOUNCEMENT,
                  data: { task: data._id?.toString() },
                  ntitle: "Volunteer Work",
                  nbody: payload.title,
                } as NotificationParams);
              // Update task to include the user as a service provider

              const taskUpdatePromise = this.taskRepository.updateById(
                data._id?.toString()!,
                {
                  $addToSet: {
                    serviceProviders: {
                      user: user?._id?.toString(),
                      status: ETaskUserStatus.IDLE,
                    },
                  },
                }
              );

              // Execute all promises concurrently
              await Promise.all([
                calendarPromise,
                notificationPromise,
                taskUpdatePromise,
              ]);
            })
          );
        }
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
        await this.userWalletRepository.updateById(wallet?._id as string, {
          $inc: {
            balance: -SERVICE_INITIATION_FEE,
            amountHeld: +SERVICE_INITIATION_FEE,
          },
        });

        await this.transactionRepository.create({
          amount: SERVICE_INITIATION_FEE,
          user: userId,
          type: TransactionType.serviceInitiationFee,
          isCredit: false,
          status: ETransactionStatus.pending,
          wallet: wallet?._id as string,
          task: data._id,
        } as ITransaction);
      }

      await this.calendarRepository.create({
        user: payload.postedBy as string,
        task: data._id,
        date: data.date,
      } as ICalendar);

      if (payload.type === TaskType.megablast) {
        await this.userWalletRepository.updateById(wallet?._id as string, {
          $inc: { balance: -MEGA_BLAST_FEE },
        });

        this.transactionRepository.create({
          amount: MEGA_BLAST_FEE,
          user: userId,
          type: TransactionType.megablast,
          isCredit: false,
          status: ETransactionStatus.pending,
          wallet: wallet?._id as string,
          task: data._id,
        } as ITransaction);
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

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      // Start task update operation
      const taskUpdate = await this.taskRepository.updateById<ITask>(_id, {
        isDeleted: true,
      });

      // If task doesn't exist, return an error response
      if (!taskUpdate) {
        return ResponseHelper.sendResponse(404, "Task not found");
      }

      const chat = await this.chatRepository.getOne<IChatDoc>(
        { task: _id },
        "",
        "_id"
      );

      // Optionally update chat if chatId is provided
      if (chat && chat._id) {
        await this.chatRepository.updateById(chat._id.toString(), {
          deleted: true,
        });
        await this.chatRepository.deleteChat(chat?._id.toString());
      }

      // Delete related calendar entries
      await this.calendarRepository.deleteMany({ task: taskUpdate._id });

      // Update the user's wallet
      const wallet = await this.userWalletRepository.updateByOne<IWallet>(
        { user: taskUpdate?.postedBy?.toString() },
        {
          $inc: {
            amountHeld: -SERVICE_INITIATION_FEE,
            balance: SERVICE_INITIATION_FEE,
          },
        }
      );

      // Log the transaction for the fee refund
      await this.transactionRepository.create({
        amount: SERVICE_INITIATION_FEE,
        user: taskUpdate.postedBy,
        type: TransactionType.serviceInitiationFee,
        isCredit: true,
        status: ETransactionStatus.completed,
        wallet: wallet?._id as string,
        task: taskUpdate._id,
      } as ITransaction);

      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  requestToAdded = async (_id: string, user: string) => {
    try {
      const taskId = new mongoose.Types.ObjectId(_id);
      const userId = new mongoose.Types.ObjectId(user);

      // Perform all necessary checks and fetch the wallet in parallel
      const [isPreviouslyRejected, isUserExistInTask, wallet] =
        await Promise.all([
          // Check if the user was previously rejected
          this.taskRepository.exists({
            _id: taskId,
            "serviceProviders.user": userId,
            "serviceProviders.status": ETaskUserStatus.REJECTED,
          }),

          // Check if the user exists in the task
          this.taskRepository.exists({
            _id: taskId,
            "serviceProviders.user": userId,
          }),

          // Fetch the user's wallet
          this.userWalletRepository.getOne<IWallet>({ user: userId }),
        ]);

      // Handle the case where the user was previously rejected
      if (isPreviouslyRejected) {
        return ResponseHelper.sendResponse(
          422,
          "You are previously rejected from this task and can't request again"
        );
      }

      // Handle the case where the user is already in the task
      if (isUserExistInTask) {
        return ResponseHelper.sendResponse(422, "You are already in this task");
      }

      // Handle the case where the wallet is not found
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

      await this.userWalletRepository.updateById(wallet._id as string, {
        $inc: { balance: -REQUEST_ADDED_FEE },
      });

      const response: ITask | null = await this.taskRepository.updateById(_id, {
        $addToSet: {
          serviceProviders: {
            user,
            status: ETaskUserStatus.PENDING,
          },
        },
        $inc: { pendingCount: 1 },
      });

      if (!response) return ResponseHelper.sendResponse(404);

      const [transactionResult, notificationResult] = await Promise.all([
        this.transactionRepository.create({
          amount: REQUEST_ADDED_FEE,
          user,
          type: TransactionType.taskAddRequest,
          status: ETransactionStatus.pending,
          isCredit: false,
          wallet: wallet._id as string,
          task: _id,
        } as ITransaction),

        this.notificationService.createAndSendNotification({
          senderId: user,
          receiverId: response.postedBy,
          type: ENOTIFICATION_TYPES.TASK_REQUEST,
          data: { task: _id },
          ntitle: "Task Request",
          nbody: `${findUser.firstName} has requested to be added to the task`,
        } as NotificationParams),
      ]);

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
    status: number,
    isRequestToBeAdded: boolean
  ) => {
    try {
      const isExist = await this.taskRepository.exists({
        _id: new mongoose.Types.ObjectId(_id),
        serviceProviders: {
          $elemMatch: { user: new mongoose.Types.ObjectId(user), status },
        },
      });

      if (isExist) {
        return ResponseHelper.sendResponse(422, `Status is already ${status}`);
      }

      const task = await this.taskRepository.getById<ITask>(_id, "", "", {
        path: "postedBy",
        select: "firstName lastName",
        model: "Users",
      });
      console.log("~ task", task);

      if (!task) return ResponseHelper.sendResponse(404, "Task not found");

      const updateCount: any = { $inc: {} };
      const noOfServiceProvider = task?.noOfServiceProvider;
      const originalStatus = status;
      const acceptedProvidersCount = task?.serviceProviders.filter(
        (provider) => provider.status === 4
      ).length;

      if (
        status === ETaskUserStatus.ACCEPTED &&
        acceptedProvidersCount >= noOfServiceProvider
      ) {
        status = 3; // Standby if service providers are full
      } else if (status === ETaskUserStatus.ACCEPTED) {
        updateCount["$inc"].acceptedCount = 1;
        updateCount["$inc"].idleCount = -1;
      }

      if (status === ETaskUserStatus.ACCEPTED || status === 3) {
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

      if (!response) return ResponseHelper.sendResponse(404);

      const userData: IUser | null = await this.userRepository.getById(
        user,
        undefined,
        "firstName"
      );

      const notificationType =
        status == ETaskUserStatus.ACCEPTED
          ? ENOTIFICATION_TYPES.TASK_ACCEPTED
          : ENOTIFICATION_TYPES.TASK_REJECTED;

      const notificationTitle =
        status == ETaskUserStatus.ACCEPTED ? "Task Accepted" : "Task Rejected";

      const notificationBody = (() => {
        if (isRequestToBeAdded && originalStatus === 4 && status === 3) {
          // Case where status is changed from 4 to 3
          return `${
            (task.postedBy as unknown as IUser).firstName
          } accepted your task request but the main queue is full, so you have been placed into standby.`;
        }

        // Handle normal ACCEPTED/REJECTED cases
        if (
          status === ETaskUserStatus.ACCEPTED ||
          status === ETaskUserStatus.STANDBY
        ) {
          return isRequestToBeAdded
            ? `${
                (task.postedBy as unknown as IUser).firstName
              } accepted your task request`
            : `${userData?.firstName} accepted your task request`;
        } else {
          return isRequestToBeAdded
            ? `${
                (task.postedBy as unknown as IUser).firstName
              } rejected your task request`
            : `${userData?.firstName} rejected your task request`;
        }
      })();

      // Create or delete calendar entry and chat if status is ACCEPTED
      let chatId;
      if (response && status == ETaskUserStatus.ACCEPTED) {
        if (!response.commercial) {
          await this.calendarRepository.create({
            user,
            task: response._id,
            date: response.date ?? "2024-11-11",
            type: ECALENDARTaskType.accepted,
          } as ICalendar);
        }

        await this.taskRepository.updateById(_id, {
          $addToSet: { serviceProviders: { user, status } },
        });

        chatId = await this.chatRepository.addChatForTask({
          user: response?.postedBy,
          task: _id as string,
          participant: user,
          groupName: response?.title,
          noOfServiceProvider: response.noOfServiceProvider,
        });
      }

      // Handle REJECTED status
      if (response && status == ETaskUserStatus.REJECTED) {
        await this.calendarRepository.deleteMany({
          user: new mongoose.Types.ObjectId(user),
          task: response._id,
        });
      }

      // Send Notification
      this.notificationService.createAndSendNotification({
        senderId: isRequestToBeAdded ? response.postedBy : user,
        receiverId: isRequestToBeAdded ? user : response.postedBy,
        type: notificationType,
        data: { task: response._id?.toString() },
        ntitle: notificationTitle,
        nbody: notificationBody,
      } as NotificationParams);

      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_UPDATION_PASSED, {
        response,
        chat: chatId,
      });
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  cancelTask = async (id: string, chatId: string) => {
    try {
      // Update the task status to cancelled
      const response = await this.taskRepository.updateById<ITask>(id, {
        status: ETaskStatus.cancelled,
        populate: ["serviceProviders.user"],
      });

      // Handle cases where the task is already cancelled or not found
      if (!response) return ResponseHelper.sendResponse(404, "Task not found");

      // Update the chat status
      const chat = await this.chatRepository.updateById(chatId, {
        deleted: true,
      });

      if (!chat) return ResponseHelper.sendResponse(404, "Chat not found");

      // Ensure the task is commercial
      if (!response.commercial)
        return ResponseHelper.sendResponse(400, "Task is not commercial");

      // Retrieve the service provider with ACCEPTED status
      const serviceProviderObj = response.serviceProviders.find(
        (s) => s.status === ETaskUserStatus.ACCEPTED
      );

      if (!serviceProviderObj || !serviceProviderObj.user) {
        return ResponseHelper.sendResponse(404, "Service provider not found");
      }

      const serviceProvider = serviceProviderObj.user;

      // Wrap the operation in a transaction for atomicity

      try {
        // Retrieve both wallets
        const [userWallet, serviceProviderWallet] = await Promise.all([
          this.userWalletRepository.getOne<IWallet>({
            user: response.postedBy,
          }),
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
          this.userWalletRepository.updateById(
            userWallet._id?.toString() as string,
            {
              $inc: { amountHeld: -SERVICE_INITIATION_FEE },
            }
          ),
          this.userWalletRepository.updateById(
            serviceProviderWallet._id?.toString() as string,
            {
              $inc: { balance: +SERVICE_INITIATION_FEE },
            }
          ),
        ]);

        // Record the transaction
        await this.transactionRepository.create({
          amount: SERVICE_INITIATION_FEE,
          user: serviceProvider,
          type: TransactionType.serviceInitiationFee,
          isCredit: true,
          status: ETransactionStatus.completed,
          wallet: serviceProviderWallet._id as string,
          task: response._id,
        } as ITransaction);

        // Delete the calendar entries associated with the task
        await this.calendarRepository.deleteMany({ task: response._id });

        // Send a notification to the service provider
        await this.notificationService.createAndSendNotification({
          senderId: response.postedBy,
          receiverId: serviceProvider,
          type: ENOTIFICATION_TYPES.TASK_CANCELLED,
          data: { task: response._id?.toString() },
          ntitle: "Task Cancelled",
          nbody: "Task has been cancelled",
        } as NotificationParams);

        await this.chatRepository.deleteChat(chatId);

        // Return a successful response
        return ResponseHelper.sendSuccessResponse(
          "Task cancelled successfully",
          response
        );
      } catch (error) {
        console.error("Error in transaction:", error);
        return ResponseHelper.sendResponse(
          500,
          `Failed to cancel task: ${(error as Error).message}`
        );
      }
    } catch (error) {
      console.error("Error cancelling task:", error);
      return ResponseHelper.sendResponse(
        500,
        `Failed to cancel task: ${(error as Error).message}`
      );
    }
  };
}

export default TaskService;
