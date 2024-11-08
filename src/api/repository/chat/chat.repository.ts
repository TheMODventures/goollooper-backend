import mongoose from "mongoose";
import axios, { AxiosResponse } from "axios";
import { Server } from "socket.io";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { v4 } from "uuid";
import express, { Application, Request } from "express";
import path from "path";

import * as apn from "@parse/node-apn";
import {
  IChat,
  IChatDoc,
  IChatPayload,
  IMessage,
  IParticipant,
  IReceivedBy,
  IRequest,
} from "../../../database/interfaces/chat.interface";
import { IChatRepository } from "./chat.repository.interface";
import { IUser } from "../../../database/interfaces/user.interface";
import { ITask } from "../../../database/interfaces/task.interface";
import { ICalendar } from "../../../database/interfaces/calendar.interface";
import {
  ECALENDARTaskType,
  ECALLDEVICETYPE,
  EChatType,
  EMessageStatus,
  ENOTIFICATION_TYPES,
  EParticipantStatus,
  ETICKET_STATUS,
  ETaskStatus,
  ETransactionStatus,
  EUserRole,
  MessageType,
  RequestStatus,
  TransactionType,
  USER_CALL_STATUS,
} from "../../../database/interfaces/enums";
import { Chat } from "../../../database/models/chat.model";
import { User } from "../../../database/models/user.model";
import { ModelHelper } from "../../helpers/model.helper";
import { BaseRepository } from "../base.repository";
import { UserRepository } from "../user/user.repository";
import { ResponseHelper } from "../../helpers/reponseapi.helper";
import {
  NotificationHelper,
  PushNotification,
} from "../../helpers/notification.helper";
import {
  AGORA_HEADER_TOKEN,
  APP_CERTIFICATE,
  APP_ID,
  IOS_KEY_ID,
  IOS_TEAM_ID,
} from "../../../config/environment.config";
import { TaskRepository } from "../task/task.repository";
import NotificationService, {
  NotificationParams,
} from "../../services/notification.service";
import { CalendarRepository } from "../calendar/calendar.repository";
import { IWallet } from "../../../database/interfaces/wallet.interface";
import { WalletRepository } from "../wallet/wallet.repository";
import { ERROR_NOTFOUND, SERVICE_INITIATION_FEE } from "../../../constant";
import { TransactionRepository } from "../transaction/transaction.repository";
import { ITransaction } from "../../../database/interfaces/transaction.interface";
const config = {
  key: path.resolve(__dirname, "../../../../AuthKey_KPDRMQKZUB.p8"),
};
import { WorkerRepository } from "../worker/worker.repository";
import { IWorker } from "../../../database/interfaces/worker.interface";
export class ChatRepository
  extends BaseRepository<IChat, IChatDoc>
  implements IChatRepository
{
  private io?: Server;
  private userRepository: UserRepository;
  private taskRepository: TaskRepository;
  private notificationService: NotificationService;
  private calendarRepository: CalendarRepository;
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private workerRepository: WorkerRepository;
  protected app: Application;

  constructor(io?: Server) {
    super(Chat);
    this.app = express();
    this.io = io;
    this.userRepository = new UserRepository();
    this.taskRepository = new TaskRepository();
    this.calendarRepository = new CalendarRepository();
    this.walletRepository = new WalletRepository();
    this.notificationService = new NotificationService();
    this.transactionRepository = new TransactionRepository();
    this.workerRepository = new WorkerRepository();
  }

  deleteChat = async (chatId: string) => {
    this.io?.emit(`deleteChat/${chatId}`, { chatId, deleted: true });
  };

  async getChats(
    user: string,
    page = 1,
    pageSize = 20,
    chatSupport = false,
    chatId: string | null = null,
    search?: string
  ) {
    try {
      const skip = (page - 1) * pageSize;
      const currentUserId = new mongoose.Types.ObjectId(user);
      const chatSupportPip: any = {
        isChatSupport: chatSupport == true,
        deleted: false,
      };
      if (chatId) chatSupportPip._id = new mongoose.Types.ObjectId(chatId);
      const query: any = [
        {
          $match: {
            ...chatSupportPip,
            $or: [
              {
                $and: [
                  { "participants.user": currentUserId },
                  { "participants.status": EParticipantStatus.ACTIVE },
                  { chatType: EChatType.ONE_TO_ONE },
                ],
              },
              {
                $and: [
                  {
                    $or: [
                      { "participants.user": currentUserId },
                      { "messages.receivedBy.user": currentUserId },
                      { "messages.sentBy": currentUserId },
                    ],
                  },
                  { chatType: EChatType.GROUP },
                ],
              },
            ],
          },
        },
        { $sort: { lastUpdatedAt: -1 } },
        { $skip: skip },
      ];

      const remainingQuery = [
        { $limit: parseInt(pageSize.toString()) },
        {
          $lookup: {
            from: "users",
            let: { participantIds: "$participants.user" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$participantIds"],
                  },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  profileImage: 1,
                  selectedLocation: 1,
                  subscription: 1,
                  isActive: 1,
                },
              },
            ],
            as: "participantsData",
          },
        },
        {
          $unwind: { path: "$messages", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "tasks",
            let: { taskId: "$task" },
            as: "task",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$taskId"],
                  },
                },
              },
              {
                $project: {
                  title: 1,
                  description: 1,
                  status: 1,
                  date: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$task", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
            groupName: { $first: "$groupName" },
            participantUsernames: { $first: "$participantUsernames" },
            totalMessages: { $first: "$totalMessages" },
            messages: { $push: "$messages" }, // Push the messages into an array again
            lastMessage: { $last: "$messages" }, // Get the last message as before
            participants: { $first: "$participantsData" },
            totalCount: { $first: "$totalCount" },
            unReadCount: { $first: "$unReadCount" },
            task: { $first: "$task" },
            createdBy: { $first: "$createdBy" },
          },
        },
        {
          $addFields: {
            messages: {
              // $slice: [
              //   {
              $filter: {
                input: "$messages",
                cond: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$$this.sentBy", currentUserId] },
                        { $ne: ["$$this.deleted", true] },
                      ],
                    },
                    {
                      $and: [
                        { $ne: ["$$this.sentBy", currentUserId] },
                        {
                          $in: [currentUserId, "$$this.receivedBy.user"],
                        },
                        {
                          $not: {
                            $in: [true, "$$this.receivedBy.deleted"],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            participants: {
              $map: {
                input: "$participants",
                as: "participant",
                in: {
                  $mergeObjects: [
                    "$$participant",
                    {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$participantsData",
                            cond: {
                              $eq: ["$$this._id", "$$participant.user"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
            lastMessage: { $last: "$messages" },
            totalCount: { $size: "$messages" },
            unReadCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  cond: {
                    $and: [
                      { $ne: ["$$this.sentBy", currentUserId] },
                      { $in: [currentUserId, "$$this.receivedBy.user"] },
                      {
                        $not: {
                          $in: [
                            EMessageStatus.SEEN,
                            "$$this.receivedBy.status",
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
            messages: { $reverseArray: { $slice: ["$messages", -40] } },
          },
        },
        {
          $match: {
            $or: search
              ? [{ _id: { $ne: null } }]
              : [
                  { chatType: EChatType.GROUP, messages: { $ne: [] } },
                  {
                    $and: [
                      {
                        chatType: EChatType.ONE_TO_ONE,
                        messages: { $ne: [] },
                      },
                    ],
                  },
                ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.sentBy",
            foreignField: "_id",
            as: "sender",
          },
        },
        { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
        {
          $addFields: {
            "lastMessage.firstName": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.firstName"] },
                "Unknown User",
              ],
            },
            "lastMessage.lastName": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.lastName"] },
                "Unknown User",
              ],
            },
            "lastMessage.profileImage": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.profileImage"] },
                "Unknown User",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
            groupName: { $first: "$groupName" },
            participantUsernames: { $first: "$participantUsernames" },
            totalMessages: { $first: "$totalMessages" },
            messages: { $first: "$messages" },
            lastMessage: { $first: "$lastMessage" },
            participants: { $first: "$participants" },
            totalCount: { $first: "$totalCount" },
            unReadCount: { $first: "$unReadCount" },
            task: { $first: "$task" },
            createdBy: { $first: "$createdBy" },
          },
        },
        {
          $sort: {
            "lastMessage.createdAt": -1,
          },
        },
        {
          $project: {
            chatType: 1,
            groupName: 1,
            isTicketClosed: 1,
            isChatSupport: 1,
            // messages: 1,
            lastMessage: 1,
            participants: 1,
            totalCount: 1,
            unReadCount: 1,
            task: 1,
            createdBy: 1,
          },
        },
      ];
      if (search) {
        query.push(
          ...[
            {
              $lookup: {
                from: "users",
                let: {
                  participantIds: "$participants.user",
                  isMuted: "$participants.isMuted",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $in: ["$_id", "$$participantIds"],
                      },
                    },
                  },
                  {
                    $project: {
                      firstName: 1,
                      lastName: 1,
                      username: 1,
                      fullName: {
                        $concat: ["$firstName", " ", "$lastName"],
                      },
                      email: 1,
                      profileImage: 1,
                      photoUrl: 1,
                      isMuted: {
                        $arrayElemAt: [
                          "$$isMuted",
                          {
                            $indexOfArray: ["$$participantIds", "$_id"],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "participantsData",
              },
            },
            {
              $match: {
                $or: [
                  {
                    groupName: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.firstName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.lastName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.username": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.email": { $regex: search, $options: "i" },
                  },
                  // { email: { $regex: q, $options: 'i' } },
                ],
              },
            },
          ]
        );
        remainingQuery.splice(1, 1);
      }
      query.push(...remainingQuery);
      const result = await Chat.aggregate(query);
      console.log("GET-CHAT SOCKET");

      if (this.io) this.io?.emit(`getChats/${user}`, result);
      return result;
    } catch (error) {
      // Handle error
      // console.error("Error retrieving user chats:", error);
      throw error;
    }
  }

  // Get chat messages with pagination (50 per page)
  async getChatMessages(
    chatId: string,
    user: string,
    pageNumber: number,
    pageSize = 20
  ) {
    // Step 1: Convert the page number to skip value
    const skip = (pageNumber - 1) * parseInt(pageSize.toString());

    const result = await Chat.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(chatId) } }, // Match the chat ID
      { $unwind: "$messages" }, // Unwind the messages array
      { $sort: { "messages.createdAt": -1 } }, // Sort messages by latest createdAt date
      { $skip: skip }, // Skip the specified number of messages
      { $limit: parseInt(pageSize.toString()) }, // Limit the number of messages per page
      {
        $match: {
          $or: [
            {
              "messages.sentBy": new mongoose.Types.ObjectId(user),
              "messages.deleted": { $ne: true },
            },
            {
              // "messages.receivedBy.user": { $ne: null },
              "messages.receivedBy": {
                $elemMatch: {
                  user: new mongoose.Types.ObjectId(user),
                  deleted: { $ne: true },
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "messages.sentBy",
          foreignField: "_id",
          as: "sender",
        },
      },
      { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
      {
        $addFields: {
          "messages.senderId": "$sender._id",
          "messages.firstName": "$sender.firstName",
          "messages.lastName": "$sender.lastName",
          "messages.image": "$sender.image",
        },
      },
      {
        $lookup: {
          from: "workers",
          localField: "messages.workers",
          foreignField: "_id",
          as: "messages.workers",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "task",
        },
      },
      { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          messages: { $push: "$messages" },
          requests: { $first: "$requests" },
          task: { $first: "$task" },
        },
      },
    ]);

    // Step 3: Extract the messages, total count, and unread count from the result
    const messages = result.length > 0 ? result[0].messages : [];
    const totalCount = result.length > 0 ? result[0].totalCount : 0;
    const unReadCount = result.length > 0 ? result[0].unReadCount : 0;
    const requests = result.length > 0 ? result[0].requests : 0;
    const task = result.length > 0 ? result[0].task : 0;

    // console.log("Messages:", messages);
    // console.log("Total Count:", totalCount);
    // console.log("Unread Count:", unReadCount);
    if (this.io)
      this.io?.emit(`getChatMessages/${user}`, {
        messages,
        totalCount,
        unReadCount,
        requests,
        task,
      });
    return { messages, totalCount, unReadCount, requests, task };
  }

  async createMessage(
    chatId: string,
    senderId: string,
    messageBody: string,
    urls?: string[],
    name?: string
  ) {
    try {
      const chat = await Chat.findById<IChat>(chatId).select("-messages");

      if (!chat) {
        // Handle error: Chat not found
        throw new Error("Chat not found");
      }

      if (chat.deleted) {
        if (this.io)
          this.io?.emit(
            `newMessage/${chatId}/${senderId}`,
            "cannot send message due to chat deleted"
          );
        return "cannot send message due to chat deleted";
      }

      if (chat.isTicketClosed) {
        if (this.io)
          this.io?.emit(
            `newMessage/${chatId}/${senderId}`,
            "cannot send message due to chat Closed"
          );
        return "cannot send message due to chat Closed";
      }

      const id = new mongoose.Types.ObjectId();
      let newMessage = {
        _id: id,
        body: messageBody,
        mediaUrls: urls,
        sentBy: senderId,
        receivedBy: [],
        type: MessageType.message,
        deleted: false,
        // Add other message properties if needed
      } as any;
      if (chat.participants.some((e: IParticipant) => e.isBlocked)) {
        if (this.io)
          this.io?.emit(
            `newMessage/${chatId}/${senderId}`,
            "cannot send message due to block"
          );
        return "cannot send message due to block";
      }
      chat.participants.forEach((participant: IParticipant) => {
        if (
          participant.status == EParticipantStatus.ACTIVE &&
          participant.user != senderId
        ) {
          newMessage.receivedBy.push({
            user: new mongoose.Types.ObjectId(participant.user),
            status: EMessageStatus.SENT,
            deleted: false,
          });
        }
      });
      // chat.messages.push(newMessage);
      // // console.log(newMessage);
      const lastMessage = {
        body: newMessage.body,
      };
      const updatedChat = await Chat.updateOne(
        { _id: chatId },
        {
          $push: { messages: newMessage },
          lastMessage,
          lastUpdatedAt: new Date(),
        },
        { new: true }
      );
      const userIds: any[] = [];
      chat.participants.forEach(async (participant: IParticipant) => {
        if (
          participant.status == EParticipantStatus.ACTIVE &&
          participant.user != senderId
        ) {
          if (!participant.isMuted) userIds.push(participant.user);
          if (this.io) {
            this.io?.emit(`newMessage/${chatId}/${participant.user}`, {
              ...newMessage,
              name,
              firstName: name,
              createdAt: new Date(),
            });
            await this.getChats(
              participant.user.toString(),
              1,
              10,
              chat.isChatSupport
            );
          }
        }
      });
      this.sendNotificationMsg(
        {
          userIds,
          title: name,
          body: messageBody,
          chatId,
          urls,
          chatType: chat.chatType,
          groupName: chat?.groupName,
        },
        chat
      );
      return updatedChat;
    } catch (error) {
      // Handle error
      // console.error("Error creating message:", error);
      throw error;
    }
  }

  sendRequest = async (
    chatId: string,
    senderId: string,
    dataset: Partial<IRequest>
  ) => {
    try {
      let chat: IChat | any = await Chat.findOne({ _id: chatId });
      if (!chat) return ResponseHelper.sendResponse(404, "Chat not found");

      // dataset.createdBy = senderId;
      const requestId = await Chat.updateOne(
        { _id: chatId },
        { $push: { requests: dataset } },
        { new: true }
      );
      const newRequest: IChat | any = await Chat.findById(chatId);

      if (!requestId || !newRequest) {
        this.io?.emit(`error`, { error: "Chat not found" });
        return;
      }

      const newRequestId =
        newRequest.requests[newRequest.requests.length - 1]._id;
      let msg: IMessage = {
        body: "Request",
        sentBy: senderId,
        requestId: newRequestId,
        receivedBy: newRequest.participants.map((e: IParticipant) => ({
          user: e.user,
          status: EMessageStatus.SENT,
        })),
      };

      switch (dataset.type?.toString()) {
        case "1":
          msg.type = MessageType.request;
          if (dataset.mediaUrl) {
            msg.body = "This is my Request";
            msg.mediaUrls = [dataset.mediaUrl];
          }
          break;

        case "2":
          msg.body = "Pause";
          msg.type = MessageType.pause;
          await this.taskRepository.updateById<ITask>(chat?.task, {
            status: ETaskStatus.pause,
          });
          break;

        case "3":
          msg.body = "You have been Relieve from the Task";
          msg.type = MessageType.relieve;
          console.log("🚀 break_point", dataset);
          // console.log("🚀 chat",chat);

          const tasks = await this.taskRepository.getById<ITask>(chat?.task);

          if (!tasks)
            return this.io?.emit(`error`, { error: "Task not found" });

          console.log("🚀 break_point 2", dataset);

          const findStandByServiceProvider = tasks.serviceProviders.find(
            (sp) => sp.status === 3
          );

          const updatedServiceProviders = tasks.serviceProviders.map((sp) => {
            // First, change the status from 4 to 5
            if (sp.status === 4) {
              return { ...sp, status: 5 };
            }

            // Then, if sp matches the found standby service provider, change status from 3 to 4
            if (
              findStandByServiceProvider &&
              sp.user.toString() === findStandByServiceProvider.user.toString()
            ) {
              return { ...sp, status: 4 }; // Move from standby (3) to active (4)
            }

            return sp;
          });
          console.log("🚀 break_point 3", dataset);
          console.log(
            "🚀 findStandByServiceProvider",
            findStandByServiceProvider
          );

          if (findStandByServiceProvider) {
            await this.notificationService.createAndSendNotification({
              ntitle: "your request has been accepted",
              nbody: "Relieve Action Request",
              receiverId: findStandByServiceProvider?.user as string,
              type: ENOTIFICATION_TYPES.ACTION_REQUEST,
              senderId: senderId as string,
              data: {
                type: ENOTIFICATION_TYPES.ACTION_REQUEST,
                task: chat?.task?.toString(),
              },
            } as NotificationParams);
          }

          // console.log(updatedServiceProviders, "updatedServiceProviders");
          await this.taskRepository.updateById<ITask>(chat?.task, {
            serviceProviders: updatedServiceProviders,
          });

          const creatorId = chat.createdBy ? chat.createdBy.toString() : "";

          const updatedParticipants = chat.participants.filter(
            (participant: IParticipant) =>
              participant.user.toString() === creatorId
          );
          updatedParticipants.push({
            user: findStandByServiceProvider?.user,
            status: "active",
          });

          await this.updateById<IChat>(chat._id, {
            participants: updatedParticipants,
            requests: [],
            messages: [],
          });
          break;

        case "4":
          msg.body = "Proceed";
          msg.type = MessageType.proceed;
          const taskUpdateResponse =
            await this.taskRepository.updateByOne<ITask>(
              { _id: chat?.task },
              {
                status: ETaskStatus.assigned,
              }
            );

          const serviceProvider = taskUpdateResponse?.serviceProviders?.find(
            (sp) => sp.status === 4
          )?.user;

          if (serviceProvider) {
            const event = await this.calendarRepository.create<ICalendar>({
              user: serviceProvider,
              task: chat.task,
              type: ECALENDARTaskType.accepted,
              date: taskUpdateResponse.date,
            });

            console.log(
              "🚀 ~ file: chat.repository.ts ~ line 366 ~ ChatRepository ~ sendRequest= ~ event",
              event
            );
          }

          break;

        case "5": {
          const taskId = chat?.task;
          const amount = dataset.amount;
          const isServiceProviderInvoice =
            dataset.status === RequestStatus.SERVICE_PROVIDER_INVOICE_REQUEST;

          // Early return if amount is undefined and it's a service provider invoice request
          if (
            (amount === undefined || amount === null) &&
            isServiceProviderInvoice
          ) {
            this.io?.emit(`error`, { error: "Amount is required" });
            console.log("🚀 ELSE CASE: Amount is required and not provided.");
            return;
          }

          console.log("🚀 CASE 5", dataset);

          // Set initial message properties
          msg.type = MessageType.invoice;
          msg.body = isServiceProviderInvoice ? `invoice ${amount}` : "Invoice";
          if (dataset.mediaUrl) msg.mediaUrls = [dataset.mediaUrl];

          if (!taskId) {
            this.io?.emit(`error`, { error: "Task id is required" });
            return;
          }

          // Fetch the task associated with the chat
          const task: ITask | null = await this.taskRepository.getById(taskId);
          if (!task) return this.io?.emit(`error`, { error: "Task not found" });

          if (task.commercial) {
            // Update invoice amount for commercial tasks
            await this.taskRepository.updateById<ITask>(taskId, {
              invoiceAmount: amount,
            });
          } else {
            // Mark non-commercial task as completed and update calendar
            msg.type = MessageType.complete;
            await Promise.all([
              this.taskRepository.updateById<ITask>(taskId, {
                status: ETaskStatus.completed,
              }),
              this.calendarRepository.updateMany<ICalendar>(
                { task: new mongoose.Types.ObjectId(taskId) },
                { isActive: false }
              ),
            ]);
          }
          break;
        }

        case "6": {
          msg.body = "Completed";
          msg.type = MessageType.complete;
          console.log("🚀 CASE 6", dataset);

          // Validate amount
          const amount = Number(dataset.amount);
          if (isNaN(amount) || amount <= 0) {
            console.log("🚀 error amount is less");
            return this.io?.emit(`error`, { error: "Amount is required" });
          }

          // Fetch the completed task
          const completedTask = await this.taskRepository.getById<ITask>(
            chat?.task
          );
          if (!completedTask) {
            return this.io?.emit(`error`, { error: "Task not found" });
            // return ResponseHelper.sendResponse(404, "Task not found");
          }
          console.log("🚀🚀🚀🚀🚀 ");
          // Check if the task is commercial and validate the invoice amount
          if (completedTask.commercial) {
            if (
              completedTask.invoiceAmount === undefined ||
              amount < completedTask.invoiceAmount
            ) {
              this.io?.emit(`error`, {
                error: "Amount should be greater than the invoice amount",
              });
              // return ResponseHelper.sendResponse(
              //   404,
              //   "Amount should be greater than the invoice amount"
              // );
            }

            // Fetch and validate user wallet
            // Retrieve the sender's wallet
            const userWallet = await this.walletRepository.getOne<IWallet>({
              user: senderId,
            });

            if (!userWallet) {
              return this.io?.emit(`error`, { error: "Wallet not found" });
            }

            if (userWallet.balance < amount) {
              console.log("code stopped here");
              this.io?.emit(`error`, { error: "Insufficient balance" });
              return;
              // return ResponseHelper.sendResponse(404, "Insufficient balance");
            }

            // Retrieve the service provider's ID
            const serviceProviderId = completedTask.serviceProviders.find(
              (sp) => sp.status === 4
            )?.user as string;

            console.log("🚀", serviceProviderId);

            // Retrieve the service provider's wallet
            const serviceProviderWallet =
              await this.walletRepository.getOne<IWallet>({
                user: serviceProviderId,
              });

            // Update both wallets and create transactions in parallel
            await Promise.all([
              this.walletRepository.updateByOne<IWallet>(
                { user: senderId },
                {
                  $inc: {
                    amountHeld: -SERVICE_INITIATION_FEE,
                    balance: -(amount - SERVICE_INITIATION_FEE),
                  },
                }
              ),
              this.walletRepository.updateBalance(serviceProviderId, +amount),
            ]);

            // Create transactions for both the service provider and sender
            await Promise.all([
              this.transactionRepository.create<ITransaction>({
                amount: amount,
                user: serviceProviderId,
                type: TransactionType.task,
                wallet: serviceProviderWallet?._id as string,
                status: ETransactionStatus.completed,
                isCredit: true,
              }),
              this.transactionRepository.create<ITransaction>({
                amount: SERVICE_INITIATION_FEE,
                user: senderId,
                type: TransactionType.serviceInitiationFee,
                wallet: userWallet?._id as string,
                status: ETransactionStatus.completed,
                isCredit: true,
              }),
              this.transactionRepository.create<ITransaction>({
                amount: amount,
                user: senderId,
                type: TransactionType.task,
                wallet: userWallet?._id as string,
                status: ETransactionStatus.completed,
                isCredit: false,
              }),
            ]);

            await Promise.all([
              this.taskRepository.updateById<ITask>(chat?.task, {
                status: ETaskStatus.completed,
              }),
              this.calendarRepository.updateMany<ICalendar>(
                { task: new mongoose.Types.ObjectId(chat?.task) },
                { isActive: false }
              ),
            ]);

            console.log("🚀 CASE 6", dataset);
          }
          break;
        }

        case "7":
          msg.type = MessageType.tour;
          if (
            (!dataset?.date || !dataset?.slot) &&
            dataset.status === RequestStatus.CLIENT_TOUR_REQUEST_ACCEPT
          ) {
            return this.io?.emit(`error`, {
              error: "Date and slot are required",
            });
          }
          msg.body = "Tour";
          break;

        case "8":
          msg.type = MessageType.reschedule;
          msg.body = "Task Rescheduled";
          break;

        case "9":
          msg.type = MessageType.bill;

          if (!dataset.amount)
            return this.io?.emit(`error`, { error: "Amount is required" });

          msg.body = dataset.amount;

          const task = await this.taskRepository.getById<ITask>(chat?.task);
          if (!task) {
            return this.io?.emit(`error`, { error: ERROR_NOTFOUND });
          }

          const updatedTask = await this.taskRepository.updateById<ITask>(
            chat?.task,
            {
              invoiceAmount: dataset.amount,
            }
          );

          if (!updatedTask) {
            return this.io?.emit(`error`, { error: ERROR_NOTFOUND });
          }

          break;
        case "10":
          msg.type = MessageType.pay;
          msg.body = "Pay";
          console.log("🚀 CASE 10", dataset);

          // Validate dataset.amount
          const amount = Number(dataset.amount);
          if (isNaN(amount) || amount <= 0) {
            return this.io?.emit(`error`, {
              error: "A valid amount is required",
            });
          }

          // Validate paymentRecipients array
          const paymentRecipients = dataset.paymentRecipients;
          if (
            !Array.isArray(paymentRecipients) ||
            paymentRecipients.length === 0
          ) {
            return this.io?.emit(`error`, {
              error: "Payment recipients are required",
            });
          }

          // Calculate total amount to be paid
          const totalAmount = amount * paymentRecipients.length;

          // Fetch the sender's wallet
          const userWallet = await this.walletRepository.getOne<IWallet>({
            user: senderId,
          });
          if (!userWallet) {
            return this.io?.emit(`error`, { error: "Wallet not found" });
          }

          // Check if user has sufficient balance
          if (userWallet.balance < totalAmount) {
            return this.io?.emit(`error`, { error: "Insufficient balance" });
          }

          try {
            // Process each payment recipient
            const transactions = await Promise.all(
              paymentRecipients.map(async (recipientId: string) => {
                const recipientWallet =
                  await this.walletRepository.getOne<IWallet>({
                    user: recipientId,
                  });
                if (!recipientWallet) {
                  this.io?.emit(`error`, {
                    error: `Recipient wallet not found for user ${recipientId}`,
                  });
                  return null;
                }

                // Create a transaction for the recipient
                await this.transactionRepository.create<ITransaction>({
                  amount,
                  user: recipientId,
                  type: TransactionType.task,
                  wallet: recipientWallet._id as string,
                  status: ETransactionStatus.completed,
                  isCredit: true,
                });

                // Update the recipient's wallet balance by adding the amount
                await this.walletRepository.updateById<IWallet>(
                  recipientWallet._id as string,
                  {
                    balance: recipientWallet.balance + amount,
                  }
                );

                return recipientWallet;
              })
            );

            // Filter out failed transactions
            const successfulTransactions = transactions.filter(
              (t) => t !== null
            );

            // Deduct total amount from sender's wallet after successful transactions
            if (successfulTransactions.length > 0) {
              await this.walletRepository.updateById<IWallet>(
                userWallet._id as string,
                {
                  balance: userWallet.balance - totalAmount,
                }
              );

              await this.transactionRepository.create<ITransaction>({
                amount: totalAmount,
                user: senderId,
                type: TransactionType.task,
                wallet: userWallet._id as string,
                status: ETransactionStatus.completed,
                isCredit: false,
              });
            } else {
              this.io?.emit(`error`, {
                error: "No transactions were successful",
              });
            }
          } catch (error) {
            this.io?.emit(`error`, { error: "Payment process failed" });
          }

          break;
        case "11":
          msg.type = MessageType.addWorkers;
          msg.body = "Workers Added";

          const { workers } = dataset;

          // Early return for validation error
          if (!Array.isArray(workers) || workers.length === 0) {
            return this.io?.emit("error", { error: "Workers are required" });
          }

          // Update the chat with new workers
          await this.updateById<IChat>(chatId, {
            $addToSet: { workers: { $each: workers } },
          });

          // Fetch details of the workers added
          const workerDetails = await this.workerRepository.getAll<IWorker>({
            _id: { $in: workers },
          });

          // Attach the worker details to the message
          msg.workers = workerDetails;
          break;
        case "12":
          msg.type = MessageType.removeWorkers;
          msg.body = "Workers Removed";

          const workersToRemove = dataset.workers;

          if (!Array.isArray(workersToRemove) || workersToRemove.length === 0) {
            return this.io?.emit("error", { error: "Workers are required" });
          }

          const updatedChatRemove = await this.updateById<IChat>(chatId, {
            $pull: { workers: { $in: workersToRemove } },
          });

          break;
        default:
          break;
      }

      const response = await Chat.updateOne<IChat>(
        { _id: chatId },
        { $push: { messages: msg } },
        { new: true }
      );

      const user = await User.findById(senderId);
      const userIds: any[] = [];
      newRequest.participants?.forEach(async (participant: IParticipant) => {
        if (participant.status == EParticipantStatus.ACTIVE) {
          if (!participant.isMuted && participant.user != senderId)
            userIds.push(participant.user);
          if (this.io) {
            this.io?.emit(`newRequest/${chatId}/${participant.user}`, {
              request: newRequest.requests[newRequest.requests.length - 1],
            });
            this.io?.emit(`newMessage/${chatId}/${participant.user}`, {
              ...msg,
              senderId: user?._id,
              firstName: user?.firstName,
              lastName: user?.lastName,
              createdAt: new Date(),
            });
            await this.getChats(participant.user.toString());
          }
        }
      });

      this.sendNotificationMsg({
        userIds,
        title: user?.firstName,
        body: msg,
        chatId,
        chatType: chat.chatType,
        groupName: chat?.groupName,
      });

      userIds.forEach(async (userId: string) => {
        await this.notificationService.createAndSendNotification({
          ntitle: `${msg.body} Action Request`,
          nbody: msg.body,
          receiverId: userId,
          type: ENOTIFICATION_TYPES.ACTION_REQUEST,
          senderId: senderId as string,
          data: {
            type: ENOTIFICATION_TYPES.ACTION_REQUEST,
            chatId: chatId,
            chatType: chat.chatType,
            groupName: chat?.groupName,
            user: senderId,
          },
        } as NotificationParams);
      });

      return response;
    } catch (error) {
      console.log(
        "🚀 ~ file: chat.repository.ts ~ line 566 ~ ChatRepository ~ sendRequest= ~ error",
        error
      );
      this.io?.emit(`error`, { error: "something went wrong" });
      return;
    }
  };

  async readAllMessages(chatId: string, user: string) {
    try {
      const filter = {
        _id: chatId,
        messages: {
          $elemMatch: {
            "receivedBy.user": user,
            "receivedBy.status": { $ne: EMessageStatus.SEEN },
            "receivedBy.deleted": { $ne: true },
          },
        },
      };
      const update = {
        $set: {
          "messages.$[msgElem].receivedBy.$[recElem].status":
            EMessageStatus.SEEN,
        },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.user": user },
          { "recElem.user": user },
        ],
      };

      const result = await Chat.updateMany(filter, update, options);
      // console.log("Update result:", result);
      if (this.io)
        this.io?.emit(`readMessages/${chatId}/${user}`, {
          message:
            result.modifiedCount > 0
              ? "messages read"
              : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      // console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Delete a message for a user
  async deleteAllMessage(
    chatId: string,
    user: string | mongoose.Types.ObjectId
  ) {
    try {
      user = new mongoose.Types.ObjectId(user);
      const filter = {
        _id: new mongoose.Types.ObjectId(chatId),
        // $or: [
        //   {
        //     "messages.receivedBy.user": user,
        //     "messages.receivedBy.deleted": { $ne: true },
        //   },
        //   {
        //     "messages.sentBy": user,
        //     "messages.deleted": { $ne: true },
        //   },
        // ],
      };

      const update = {
        $set: {
          "messages.$[msgElem].receivedBy.$[recElem].deleted": true,
          "messages.$[msgElem2].deleted": true,
        },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.user": user },
          { "recElem.user": user },
          { "msgElem2.sentBy": user },
        ],
      };
      const result = await Chat.updateMany(filter, update, options);
      // console.log(result);
      if (this.io)
        this.io?.emit(`deleteMessages/${chatId}/${user}`, {
          message:
            result.modifiedCount > 0
              ? "messages deleted"
              : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      // console.error("Error deleting messages:", error);
      throw error;
    }
  }

  async deleteSelectedMessage(chatId: string, user: string, msgIds?: string[]) {
    try {
      const filter = {
        _id: chatId,
        $or: [
          {
            "messages.receivedBy.user": user,
            "messages.receivedBy.deleted": { $ne: true },
            "messages.receivedBy._id": { $in: msgIds },
          },
          {
            "messages.sentBy": user,
            "messages.deleted": { $ne: true },
            "messages._id": { $in: msgIds },
          },
        ],
      };

      const update = {
        $set: {
          "messages.$[msgElem].receivedBy.$[recElem].deleted": true,
          "messages.$[msgElem2].deleted": true,
        },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.user": user },
          { "recElem.user": user },
          { "msgElem2.sentBy": user },
        ],
      };
      const result = await Chat.updateMany(filter, update, options);
      if (this.io)
        this.io?.emit(`deleteSelectedMessages/${chatId}/${user}`, {
          // message:
          //   result.modifiedCount > 0
          //     ? "selected messages deleted"
          //     : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      // console.error("Error deleting messages:", error);
      throw error;
    }
  }

  async createChatSupport(user: string, topic = "new topic") {
    const u = (await this.userRepository.getAll(
      {
        role: { $in: [EUserRole.admin, EUserRole.support, EUserRole.subAdmin] },
        isActive: true,
      },
      undefined,
      ModelHelper.userSelect,
      undefined,
      undefined,
      true,
      1,
      200
    )) as IUser[];
    // // console.log(u)
    topic = Math.random().toString(36).substring(3, 15).toUpperCase();
    let data: any = await Chat.create({
      groupName: topic,
      chatType: EChatType.GROUP,
      ticketStatus: ETICKET_STATUS.PENDING,
      isChatSupport: true,
      participants: [
        {
          user: user,
          status: EParticipantStatus.ACTIVE,
        },
        ...u.map((e: IUser) => ({
          user: e._id,
          status: EParticipantStatus.ACTIVE,
        })),
      ],
      createdBy: user,
      messages: [
        {
          body: "welcome to chat support.",
          sentBy: u[0]._id,
          receivedBy: [
            {
              user,
            }, //...u.map((e) => ({ user: e._id }))
          ],
          deleted: false,
        },
      ],
      // admins: chatType == EChatType.ONE_TO_ONE ? [] : [user],
    });
    data = await Chat.aggregate(findUserpipeline({ _id: data._id }));
    if (this.io)
      data[0].participants.forEach((e: IParticipant) => {
        // if(e!=user)
        this.io?.emit(`createChatSupport/${e.user}`, {
          message: "chat support created",
          data: data[0],
        });
      });
    return data[0];
  }

  async changeTicketStatus(chatId: string, ticketStatus: ETICKET_STATUS) {
    if (
      ticketStatus != ETICKET_STATUS.PROGRESS &&
      ticketStatus != ETICKET_STATUS.COMPLETED
    ) {
      console.log(ticketStatus);
      if (this.io)
        this.io.emit(`changeTicketStatus/${chatId}`, {
          message: `invalid ticket Status allowed status ${ETICKET_STATUS.PROGRESS}, ${ETICKET_STATUS.COMPLETED}`,
          // data: data,
        });
      return;
    }
    const data: any = await Chat.findOneAndUpdate(
      { _id: chatId, isChatSupport: true },
      { ticketStatus },
      { new: true }
    ).select("-messages");
    if (this.io) {
      data.participants.forEach((e: IParticipant) => {
        // if(e!=userId)
        this.io?.emit(`changeTicketStatus/${e.user}`, {
          message: "ticket status updated",
          data: data,
        });
      });
    }
  }

  async closeChatSupport(chatId: string, user: string) {
    const data: any = await Chat.findOneAndUpdate(
      { _id: chatId, isChatSupport: true },
      { isTicketClosed: true, ticketStatus: ETICKET_STATUS.CLOSED },
      { new: true }
    ).select("-messages");
    if (this.io) {
      data.participants.forEach((e: IParticipant) => {
        // if(e!=user)
        this.io?.emit(`closeChatSupportTicket/${e.user}`, {
          message: "ticket closed",
          data: data,
        });
      });
    }
  }

  async createChat(
    user: string,
    participantIds: string[],
    chatType: string,
    groupName: string,
    groupImageUrl?: string
  ) {
    try {
      let match: any = {
        "participants.user": { $all: participantIds },
        deleted: false,
      };
      let check: any = null;
      if (chatType == EChatType.ONE_TO_ONE) {
        match.chatType = EChatType.ONE_TO_ONE;
        check = await Chat.findOne(match);
      }
      if (check) {
        check = await Chat.aggregate(findUserpipeline({ _id: check._id }));
        if (this.io)
          participantIds.forEach((e) => {
            this.io?.emit(`createChat/${e}`, {
              message: "chat already exits",
              data: check[0],
            });
          });
        return check[0];
      }
      const messages: IMessage[] = [];
      let usernames = "";
      let createdByUsername = "";
      const users = await this.userRepository.getAll(
        {
          _id: participantIds.map(
            (e: string) => new mongoose.Types.ObjectId(e)
          ),
        },
        undefined,
        ModelHelper.userSelect
      );
      users.forEach((e: any) => {
        if (e._id.toString() !== user) usernames += `${e.firstName ?? ""}, `;
        else createdByUsername = `${e.firstName ?? ""}`;
      });
      participantIds.forEach(async (participant: string) => {
        const welcomeMessageBody = `you ${
          chatType == EChatType.GROUP ? "created a group" : "started a"
        } chat with ${usernames}`;

        // Add the welcome message to the chat
        const welcomeMessage: IMessage = {
          body: welcomeMessageBody.slice(0, welcomeMessageBody.length - 2),
          type: MessageType.system,
          receivedBy: [
            { user: participant, status: EMessageStatus.SENT },
          ] as IReceivedBy[],
        };

        if (participant !== user) {
          welcomeMessage.body = `you started a chat with ${users
            .map((e: any) =>
              e?._id.toString() === participant ? "" : e.firstName ?? ""
            )
            .filter((e) => e !== "")
            .join(", ")}`;
        }

        messages.push(welcomeMessage);
      });
      const data = await Chat.create({
        groupName,
        chatType,
        groupImageUrl,
        participants: participantIds.map((e) => ({
          user: e,
          status: EParticipantStatus.ACTIVE,
        })),
        createdBy: user,
        admins: chatType == EChatType.ONE_TO_ONE ? [] : [user],
        messages,
      });
      const d = await Chat.aggregate(findUserpipeline({ _id: data._id }));
      if (this.io)
        participantIds.forEach((e) => {
          // if(e!=user)
          this.io?.emit(`createChat/${e}`, {
            message: "chat created",
            data: d[0],
          });
        });
      if (chatType === EChatType.GROUP) {
        this.sendNotificationMsg(
          {
            userIds: participantIds.filter((item) => item !== user),
            title: groupName,
            body: "You are added to a group",
            chatId: d[0]._id,
          },
          d[0]
        );
      }
      return d[0];
    } catch (e) {
      // console.log(e);
      return e;
    }
  }

  async getAllChats(
    user: string,
    page = 1,
    pageSize = 20,
    chatSupport = false,
    chatId = null,
    search?: string
  ) {
    try {
      const skip = (page - 1) * pageSize;
      const currentUserId = new mongoose.Types.ObjectId(user);
      const chatSupportPip: any = {
        isChatSupport: chatSupport == true,
        deleted: false,
      };
      if (chatId) chatSupportPip._id = new mongoose.Types.ObjectId(chatId);
      const query: any = [
        {
          $match: {
            ...chatSupportPip,
            $or: [
              {
                $and: [
                  { "participants.user": currentUserId },
                  { "participants.status": EParticipantStatus.ACTIVE },
                  { chatType: EChatType.ONE_TO_ONE },
                ],
              },
              {
                $and: [
                  {
                    $or: [
                      { "participants.user": currentUserId },
                      { "messages.receivedBy.user": currentUserId },
                      { "messages.sentBy": currentUserId },
                    ],
                  },
                  { chatType: EChatType.GROUP },
                ],
              },
            ],
          },
        },
        { $sort: { lastUpdatedAt: -1 } },
        { $skip: skip },
      ];

      const remainingQuery = [
        { $limit: parseInt(pageSize.toString()) },
        {
          $lookup: {
            from: "users",
            let: { participantIds: "$participants.user" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$participantIds"],
                  },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  profileImage: 1,
                },
              },
            ],
            as: "participantsData",
          },
        },
        {
          $unwind: { path: "$messages", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
            groupName: { $first: "$groupName" },
            participantUsernames: { $first: "$participantUsernames" },
            totalMessages: { $first: "$totalMessages" },
            messages: { $push: "$messages" }, // Push the messages into an array again
            lastMessage: { $last: "$messages" }, // Get the last message as before
            participants: { $first: "$participantsData" },
            totalCount: { $first: "$totalCount" },
            unReadCount: { $first: "$unReadCount" },
            createdBy: { $first: "$createdBy" },
          },
        },
        {
          $addFields: {
            messages: {
              // $slice: [
              //   {
              $filter: {
                input: "$messages",
                cond: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$$this.sentBy", currentUserId] },
                        { $ne: ["$$this.deleted", true] },
                      ],
                    },
                    {
                      $and: [
                        { $ne: ["$$this.sentBy", currentUserId] },
                        {
                          $in: [currentUserId, "$$this.receivedBy.user"],
                        },
                        {
                          $not: {
                            $in: [true, "$$this.receivedBy.deleted"],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            participants: {
              $map: {
                input: "$participants",
                as: "participant",
                in: {
                  $mergeObjects: [
                    "$$participant",
                    {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$participantsData",
                            cond: {
                              $eq: ["$$this._id", "$$participant.user"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
            lastMessage: { $last: "$messages" },
            totalCount: { $size: "$messages" },
            unReadCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  cond: {
                    $and: [
                      { $ne: ["$$this.sentBy", currentUserId] },
                      { $in: [currentUserId, "$$this.receivedBy.user"] },
                      {
                        $not: {
                          $in: [
                            EMessageStatus.SEEN,
                            "$$this.receivedBy.status",
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
            messages: { $reverseArray: { $slice: ["$messages", -40] } },
          },
        },
        {
          $match: {
            $or: search
              ? [{ _id: { $ne: null } }]
              : [
                  { chatType: EChatType.GROUP, messages: { $ne: [] } },
                  {
                    $and: [
                      {
                        chatType: EChatType.ONE_TO_ONE,
                        messages: { $ne: [] },
                      },
                    ],
                  },
                ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.sentBy",
            foreignField: "_id",
            as: "sender",
          },
        },
        { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
        {
          $addFields: {
            "lastMessage.firstName": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.firstName"] },
                "Unknown User",
              ],
            },
            "lastMessage.lastName": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.lastName"] },
                "Unknown User",
              ],
            },
            "lastMessage.profileImage": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.profileImage"] },
                "Unknown User",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
            groupName: { $first: "$groupName" },
            participantUsernames: { $first: "$participantUsernames" },
            totalMessages: { $first: "$totalMessages" },
            messages: { $first: "$messages" },
            lastMessage: { $first: "$lastMessage" },
            participants: { $first: "$participants" },
            totalCount: { $first: "$totalCount" },
            unReadCount: { $first: "$unReadCount" },
            createdBy: { $first: "$createdBy" },
          },
        },
        {
          $sort: {
            "lastMessage.createdAt": -1,
          },
        },
        {
          $project: {
            chatType: 1,
            groupName: 1,
            isTicketClosed: 1,
            isChatSupport: 1,
            // messages: 1,
            lastMessage: 1,
            participants: 1,
            totalCount: 1,
            unReadCount: 1,
            createdBy: 1,
          },
        },
      ];
      if (search) {
        query.push(
          ...[
            {
              $lookup: {
                from: "users",
                let: {
                  participantIds: "$participants.user",
                  isMuted: "$participants.isMuted",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $in: ["$_id", "$$participantIds"],
                      },
                    },
                  },
                  {
                    $project: {
                      firstName: 1,
                      lastName: 1,
                      username: 1,
                      fullName: {
                        $concat: ["$firstName", " ", "$lastName"],
                      },
                      email: 1,
                      profileImage: 1,
                      photoUrl: 1,
                      isMuted: {
                        $arrayElemAt: [
                          "$$isMuted",
                          {
                            $indexOfArray: ["$$participantIds", "$_id"],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "participantsData",
              },
            },
            {
              $match: {
                $or: [
                  {
                    groupName: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.firstName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.lastName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.username": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.email": { $regex: search, $options: "i" },
                  },
                  // { email: { $regex: q, $options: 'i' } },
                ],
              },
            },
          ]
        );
        remainingQuery.splice(1, 1);
      }
      query.push(...remainingQuery);
      const result = await Chat.aggregate(query);
      return result;
    } catch (error) {
      throw ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async addChatForTask(payload: IChatPayload) {
    try {
      let messages: IMessage[] = [];

      let user = await this.userRepository.getById<IUser>(
        payload.participant as string
      );
      if (!user)
        return ResponseHelper.sendResponse(
          404,
          `Participant with Id ${payload.participant} not found`
        );
      const isExist = await Chat.exists({
        task: payload.task,
        participants: {
          $elemMatch: {
            user: new mongoose.Types.ObjectId(payload.participant),
          },
        },
      });
      if (isExist)
        return ResponseHelper.sendResponse(
          422,
          `User ${user.firstName} already in chat`
        );

      if (payload.noOfServiceProvider === 1) {
        delete payload.groupName;
        payload.chatType = EChatType.ONE_TO_ONE;
        let msg: IMessage = {
          body: `Hey ${
            user?.username || user?.firstName
          }, I think you are a good candidate for this task. I am looking forward in working with you on this task.`,
          sentBy: payload.user,
          receivedBy: [
            {
              user: payload.participant,
              status: EMessageStatus.SENT,
            } as IReceivedBy,
          ],
        };
        messages.push(msg);
      } else {
        payload.chatType = EChatType.GROUP;
        let msg: IMessage = {
          body: `Hey, I think you guys are good candidates for this task. I am looking forward in working with you all on this task.`,
          sentBy: payload.user,
          receivedBy: [
            {
              user: payload.participant,
              status: EMessageStatus.SENT,
            } as IReceivedBy,
          ],
        };
        messages.push(msg);
      }
      const isChatExist = await Chat.exists({
        task: payload.task,
      });
      let data: any;
      if (isChatExist) {
        data = await Chat.updateOne(
          { _id: isChatExist._id },
          {
            $push: {
              participants: {
                user: payload.participant,
                status: EParticipantStatus.ACTIVE,
              },
              "messages.$[].receivedBy": {
                user: payload.participant,
                status: EMessageStatus.SENT,
              },
            },
            lastMessage: messages[0].body,
            lastUpdatedAt: new Date(),
          },
          { new: true }
        );
      } else {
        data = await Chat.create({
          ...payload,
          participants: [
            {
              user: payload.participant,
              status: EParticipantStatus.ACTIVE,
            },
            {
              user: payload.user,
              status: EParticipantStatus.ACTIVE,
            },
          ],
          messages: messages,
          lastMessage: messages[0].body,
          createdBy: payload.user,
        });
      }

      const d = await Chat.aggregate(
        findUserpipeline({ _id: data?._id || isChatExist?._id })
      );
      if (this.io)
        this.io?.emit(`createChat/${payload.participant}`, {
          message: "chat created",
          data: d[0],
        });

      if (payload.chatType === EChatType.GROUP) {
        this.sendNotificationMsg(
          {
            userIds: payload.participant,
            title: payload.groupName,
            body: "You are added to a group",
            chatId: d[0]._id,
          },
          d[0]
        );
      }
      return d[0];
    } catch (error) {
      console.log({ error });
      throw ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async getChatMedia(chatId: string, user: string) {
    // Assuming you have the chatId or any other identifier for the desired chat
    // const chatId = 'your_chat_id_here';

    const mediaFiles = await Chat.aggregate([
      // Match the desired chat using its ID or any other criteria
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatId),
        },
      },
      // Unwind the messages array to create separate documents for each message
      {
        $unwind: "$messages",
      },
      // Match only the messages with non-empty mediaUrls
      {
        $match: {
          "messages.mediaUrls": { $exists: true, $ne: null },
          $or: [
            {
              "messages.sentBy": new mongoose.Types.ObjectId(user),
              "messages.deleted": { $ne: true },
            },
            {
              "messages.receivedBy.user": new mongoose.Types.ObjectId(user),
              "messages.receivedBy.deleted": { $ne: true },
            },
          ],
        },
      },
      // Group the mediaUrls from all matching messages into a single array
      {
        $group: {
          _id: null,
          messages: {
            $push: {
              messageId: "$messages._id",
              mediaUrls: "$messages.mediaUrls",
            },
          },
        },
      },
      // Project the result to show messageId instead of _id
      {
        $project: {
          _id: 0,
          mediaUrls: {
            $reduce: {
              input: "$messages.mediaUrls",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
          messages: {
            $map: {
              input: "$messages",
              as: "msg",
              in: {
                messageId: "$$msg.messageId",
                mediaUrls: "$$msg.mediaUrls",
              },
            },
          },
        },
      },
    ]);
    return mediaFiles;
  }

  async updateChat(chatId: string, groupName?: string, image?: string) {
    const data: any = {};
    if (groupName) data.groupName = groupName;
    if (image) data.groupImageUrl = image;
    let m: any = await Chat.updateOne(
      { _id: chatId, chatType: EChatType.GROUP },
      { ...data }
    );
    m = null;
    m = (
      await Chat.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(chatId) } },
        ...findUserpipeline({}),
      ])
    )[0];
    // // console.log(m)
    this.io?.emit(`updateChat/${chatId}`, m);
    m.participants.forEach(async (e: IParticipant) => {
      if (e.status == EParticipantStatus.ACTIVE)
        // this.io?.emit(`getChats/${e.user.toString()}`, await this.getChats(e.user))
        await this.getChats(e.user.toString());
    });
    return m;
  }

  async updateMuteStatus(data: any) {
    const chat: IChat = await Chat.findOne({
      _id: data.chatId,
      "participants.user": data.user,
    }).select("participants");
    chat.participants.forEach((e: IParticipant) => {
      if (e.user.toString() == data.user) {
        e.isMuted = data.isMuted;
        return;
      }
    });
    return await chat.save();
  }

  async updateBlockStatus(data: any) {
    const chat: IChat = await Chat.findOne({
      _id: data.chatId,
      "participants.user": data.user,
    }).select("participants");
    chat.participants.forEach((e: IParticipant) => {
      if (e.user.toString() == data.user) {
        e.isBlocked = data.isBlocked;
        return;
      }
    });
    if (this.io)
      this.io?.emit(
        `updateBlockStatus/${data.user}`,
        "user block status updated"
      );
    return await chat.save();
  }

  async sendNotificationMsg(data: any, chat = {}) {
    const users = await this.userRepository.getAll(
      { _id: data.userIds },
      undefined,
      `fcmTokens _id`,
      undefined,
      undefined,
      true
    );
    users.forEach((e: any) => {
      NotificationHelper.sendNotification({
        title: data.title,
        body:
          data.urls?.length !== 0 && !data.body ? "sent a photo" : data.body,
        tokens: e.fcmTokens,
        data: {
          chatId: data.chatId.toString(),
          user: e._id.toString(),
          chatType: data?.chatType,
          groupName: data?.groupName,
        },
      });
    });
  }

  async getAgoraToken(req: Request) {
    const { user: userId, videoSDKInfo, calleeID } = req.body;
    const channelName = req.query?.channelName as string;
    const uid = req.query?.uid as string;
    const notifyOther = req.query?.notifyOther;

    try {
      // Check if user is already in a call
      const isUserInCall = await this.checkUserStatus(userId);
      if (isUserInCall) {
        if (this.io) this.io.emit(`/busy-user/${userId}`);
        return ResponseHelper.sendResponse(400, "User is already in a call");
      }

      // Generate Agora Token
      const token = await this.generateAgoraToken(channelName, uid);
      if (!token) {
        return ResponseHelper.sendResponse(
          500,
          "Failed to generate Agora token."
        );
      }

      // Update user status to in-call
      await this.userRepository.updateMany(
        { _id: [userId, calleeID] },
        { callStatus: USER_CALL_STATUS.BUSY }
      );

      // Notify other participants if necessary
      if (notifyOther && Array.isArray(calleeID) && calleeID.length > 0) {
        console.log("THIS METHOD CALL");
        await this.notifyParticipants(
          calleeID,
          userId,
          channelName,
          videoSDKInfo
        );
      }

      return ResponseHelper.sendSuccessResponse(
        "Agora user token generated successfully.",
        token
      );
    } catch (error) {
      console.error("Error generating Agora token:", error);
      return ResponseHelper.sendResponse(500, "Internal Server Error");
    }
  }

  // Helper function to generate Agora token
  private async generateAgoraToken(
    channelName: string,
    uid: string
  ): Promise<string> {
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 60 * 60;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpired = currentTimestamp + expirationTimeInSeconds;
    const tokenExpirationTime = currentTimestamp;
    return RtcTokenBuilder.buildTokenWithUserAccount(
      APP_ID as string,
      APP_CERTIFICATE as string,
      channelName,
      uid,
      role,
      tokenExpirationTime,
      privilegeExpired
    );
  }

  // Helper function to check if user is already in a call
  private async checkUserStatus(userId: string): Promise<boolean> {
    const user = await this.userRepository.getUserCallStatus(userId);
    return user?.callStatus === USER_CALL_STATUS.BUSY;
  }

  // Helper function to notify participants
  private async notifyParticipants(
    calleeIDs: string[],
    userId: string,
    channelName: string,
    videoSDKInfo: any
  ) {
    const chat = await Chat.findById(channelName).select("-messages");
    const callerInfo = await this.getCallerInfo(userId, chat);

    for (const calleeID of calleeIDs) {
      const recipientTokenInfo = await this.userRepository.getCallToken(
        calleeID
      );

      if (recipientTokenInfo) {
        const notificationInfo = {
          callerInfo,
          videoSDKInfo,
          type: "CALL_INITIATED",
        };

        if (recipientTokenInfo.callDeviceType === ECALLDEVICETYPE.ios) {
          await this.sendIOSNotification(
            recipientTokenInfo?.callToken as string,
            notificationInfo
          );
        } else {
          await this.sendAndroidNotification(
            recipientTokenInfo?.callToken as string,
            notificationInfo
          );
        }
      }
    }
  }

  private async getCallerInfo(userId: string, chat: any) {
    const user = await this.userRepository.getById<IUser>(
      userId,
      "",
      "firstName lastName"
    );
    return {
      chatId: chat?._id,
      title:
        chat?.chatType === EChatType.GROUP
          ? chat?.groupName
          : `${user?.firstName} ${user?.lastName}`,
      isGroup: chat?.chatType === EChatType.GROUP,
      participants: chat?.participants,
    };
  }

  private async sendIOSNotification(deviceToken: string, info: any) {
    const options: any = {
      token: {
        key: config.key,
        keyId: IOS_KEY_ID,
        teamId: IOS_TEAM_ID,
      },
      production: false,
    };
    const apnProvider = new apn.Provider(options);

    const notification = new apn.Notification({
      expiry: Math.floor(Date.now() / 1000) + 3600,
      badge: 1,
      sound: "ping.aiff",
      alert: "You have a new message",
      rawPayload: {
        callerName: info.callerInfo?.title ?? "Caller",
        aps: { "content-available": 1 },
        handle: info.callerInfo?.title ?? "Caller",
        callerInfo: info.callerInfo,
        videoSDKInfo: info.videoSDKInfo,
        data: { info, type: info.type },
        type: info.type,
        uuid: v4(),
      },
      pushType: "voip",
      topic: "com.app.goollooper.voip",
    });

    const result = await apnProvider.send(notification, deviceToken);
    console.log("iOS Notification Result:", JSON.stringify(result));
  }

  // Helper function to send Android notification
  private async sendAndroidNotification(deviceToken: string, info: any) {
    const message = {
      data: { info: JSON.stringify(info) },
      android: { priority: "high" },
      registration_ids: [deviceToken],
    };

    await NotificationHelper.sendNotification({
      data: message.data,
      tokens: message.registration_ids,
    } as PushNotification);
  }

  private async updateParticipantsCallStatus(
    participants: Array<{ _id: string }>
  ) {
    if (!participants || participants.length === 0) return;
    this.userRepository.updateMany(participants, {
      callStatus: USER_CALL_STATUS.AVAILABLE,
    });
  }

  async endCall(req: Request) {
    const { chatId, calleeID, participants, isGroup } = req.body;
    const notifyOther = req.query?.notifyOther;

    const createCallerInfo = () => ({
      chatId,
      title: "Call ended",
      isGroup: isGroup ? true : false,
      participants,
    });

    try {
      if (notifyOther && calleeID?.length) {
        for (const calleeId of calleeID) {
          const recipientTokenInfo = await this.userRepository.getCallToken(
            calleeId
          );
          if (recipientTokenInfo) {
            const callerInfo = createCallerInfo();

            if (recipientTokenInfo.callDeviceType === ECALLDEVICETYPE.ios) {
              await this.sendIOSNotification(
                recipientTokenInfo.callToken as string,
                callerInfo
              );
            } else {
              await this.sendAndroidNotification(
                recipientTokenInfo.callToken as string,
                callerInfo
              );
            }
          }
        }
      }

      await this.updateParticipantsCallStatus(participants);

      return ResponseHelper.sendSuccessResponse("Call ended successfully");
    } catch (error) {
      console.error("Error ending call:", error);
      return ResponseHelper.sendResponse(500, "Failed to end call");
    }
  }

  async updateCallToken(req: Request) {
    const user = await this.userRepository.updateById(
      req.locals.auth?.userId as string,
      { ...req.body, $addToSet: { fcmTokens: req.body.callToken } }
    );
    if (user)
      return ResponseHelper.sendSuccessResponse("Call token updated", user);
    return ResponseHelper.sendResponse(400, "Call token update failed");
  }

  async checkInChannelStatus(user: Number, channel: string): Promise<boolean> {
    try {
      const apiUrl = `https://api.agora.io/dev/v1/channel/user/property/${APP_ID}/${user}/${channel}`;
      const response: AxiosResponse<{
        data: { in_channel: boolean };
        success: boolean;
      }> = await axios.get(apiUrl, {
        headers: {
          Authorization: `Basic ${AGORA_HEADER_TOKEN}`,
        },
      });
      console.log(response.data);
      if (response.data.success) {
        return response.data.data.in_channel;
      } else {
        // Handle API response error
        console.error("API request unsuccessful:", response.data);
        return false;
      }
    } catch (error) {
      // Handle Axios request error
      console.error("Axios request error:", error);
      return false;
    }
  }

  async sendMessages(
    chatId: String,
    participants: IParticipant[],
    msg: IMessage,
    userId: string
  ) {
    const chat = await Chat.findById(chatId).select("-messages");
    const user = await User.findById(userId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const userIds: any[] = [];
    participants.forEach(async (participant: IParticipant) => {
      if (
        participant.status == EParticipantStatus.ACTIVE &&
        participant.user != userId
      ) {
        if (!participant.isMuted) userIds.push(participant.user);
        if (this.io) {
          this.io?.emit(`newMessage/${chatId}/${participant.user}`, {
            ...msg,
            name: user?.firstName,
            firstName: user?.firstName,
            createdAt: new Date(),
          });
          await this.getChats(participant.user.toString());
        }
      }
    });
    this.sendNotificationMsg(
      {
        userIds,
        title: user?.firstName,
        body: msg,
        chatId,
        chatType: chat.chatType,
        groupName: chat?.groupName,
      },
      chat
    );
    // if (this.io) {
    //   participants.forEach((participant: IParticipant) => {
    //     this.io?.emit(
    //       `newMessage/${chatId}/${participant.user.toString()}`,
    //       msg
    //     );
    //   });
    // }
    return;
  }
}

function convertTo32BitInt(hexValue: string): Number {
  try {
    const originalInt64 = BigInt(`0x${hexValue}`);
    const lower32Bits = originalInt64 & BigInt(0xffffffff);
    return Number(lower32Bits);
  } catch (error) {
    console.error("Error converting to 32-bit integer:", error);
    return NaN; // Indicate an error by returning NaN
  }
}

function findUserpipeline(match: any) {
  return [
    { $match: match },
    {
      $lookup: {
        from: "users",
        let: { participantIds: "$participants.user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$_id", "$$participantIds"],
              },
            },
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              profileImage: 1,
            },
          },
        ],
        as: "participantsData",
      },
    },
    {
      $addFields: {
        participants: {
          $map: {
            input: "$participants",
            as: "participant",
            in: {
              $mergeObjects: [
                "$$participant",
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$participantsData",
                        cond: { $eq: ["$$this._id", "$$participant.user"] },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        chatType: { $first: "$chatType" },
        groupName: { $first: "$groupName" },
        groupImageUrl: { $first: "$groupImageUrl" },
        // groupName: 1,
        participants: { $first: "$participants" },
        createdBy: { $first: "$createdBy" },
        // Add other fields you want to include
      },
    },
    {
      $project: {
        // id: '$_id',
        chatType: 1,
        groupName: 1,
        groupImageUrl: 1,
        // participantUsernames: 1,
        // totalMessages: 1,
        // messages: { $reverseArray: { $slice: ["$messages", -40] } },
        // lastMessage: { $last: "$messages" },
        participants: 1,
        createdBy: 1,
        // totalCount: 1,
        // unReadCount: 1,
      },
    },
  ];
}
