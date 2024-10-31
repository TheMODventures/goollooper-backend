import mongoose from "mongoose";
import * as SocketIO from "socket.io";
import { Request } from "express";
import _ from "lodash";

import {
  SERVICE_INITIATION_FEE,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import {
  IChat,
  IMessage,
  IParticipant,
  IRequest,
} from "../../database/interfaces/chat.interface";
import { ITask } from "../../database/interfaces/task.interface";
import { ICalendar } from "../../database/interfaces/calendar.interface";
import { ChatRepository } from "../repository/chat/chat.repository";
import { TaskRepository } from "../repository/task/task.repository";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { CalendarRepository } from "../repository/calendar/calendar.repository";
import { Authorize } from "../../middleware/authorize.middleware";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { UploadHelper } from "../helpers/upload.helper";
import {
  EMessageStatus,
  ENOTIFICATION_TYPES,
  ETaskStatus,
  MessageType,
  RequestStatus,
} from "../../database/interfaces/enums";
import { IWallet } from "../../database/interfaces/wallet.interface";
import NotificationService, {
  NotificationParams,
} from "./notification.service";

interface CustomSocket extends SocketIO.Socket {
  user?: any;
}
let clients: Record<string, string> = {};

export default (io: SocketIO.Server) => {
  console.log("Chat Socket Initialized");

  const chatRepository = new ChatRepository(io);
  const authorize = new Authorize();

  io.use(async (socket: CustomSocket, next) => {
    const token = socket.handshake.query.token;

    const result = await authorize.validateAuthSocket(token as string);
    if (result?.userId) {
      socket.user = result;
      next();
    } else next(new Error(result));
  });

  io.on("connection", async (socket: CustomSocket) => {
    console.log("clients->", clients);
    console.log(`Active Clients ${Object.keys(clients).length}`);

    socket.on(
      "getChats",
      async (data: {
        userId: string;
        page?: number;
        chatSupport?: boolean;
        chatId?: string;
        search?: string | undefined;
      }) => {
        clients[data.userId] = socket.id;
        await chatRepository.getChats(
          data.userId,
          data.page ?? 0,
          20,
          data.chatSupport ?? false,
          data.chatId ?? null,
          data.search
        );
      }
    );

    socket.on(
      "getChatMessages",
      async (data: { userId: string; chatId: string; page?: number }) => {
        clients[data.userId] = socket.id;
        await chatRepository.getChatMessages(
          data.chatId,
          data.userId,
          data.page ?? 0
        );
      }
    );

    socket.on(
      "sendMessage",
      async (data: {
        chatId: string;
        userId: string;
        messageBody: string;
        mediaUrls: string[];
        name: string;
      }) => {
        try {
          await chatRepository.createMessage(
            data.chatId,
            data.userId,
            data.messageBody,
            data.mediaUrls,
            data.name
          );
        } catch (error) {
          console.error("Error while sending chat:", error);
          socket.emit(
            `error/${data.userId}`,
            "validation error while sending chat"
          );
        }
      }
    );

    socket.on(
      "sendRequest",
      async (data: {
        chatId: string;
        userId: string;
        dataset: Partial<IRequest>;
      }) => {
        try {
          await chatRepository.sendRequest(
            data.chatId,
            data.userId,
            data.dataset
          );
        } catch (error) {
          console.error("Error while sending chat:", error);
          socket.emit(
            `error/${data.userId}`,
            "validation error while sending chat"
          );
        }
      }
    );

    socket.on(
      "deleteMessages",
      async (data: { chatId: string; userId: string }) => {
        console.log("deleteMessages executed");
        await chatRepository.deleteAllMessage(data.chatId, data.userId);
      }
    );

    socket.on(
      "deleteSelectedMessages",
      async (data: { chatId: string; userId: string }) => {
        console.log("deleteSelectedMessages executed");
        await chatRepository.deleteSelectedMessage(data.chatId, data.userId);
      }
    );

    socket.on(
      "readMessages",
      async (data: { chatId: string; userId: string }) => {
        await chatRepository.readAllMessages(data.chatId, data.userId);
      }
    );

    socket.on("updateBlockStatus", async (data: any) => {
      await chatRepository.updateBlockStatus(data);
    });

    socket.on(
      "createChat",
      async (data: {
        userId: string;
        participantIds: string[];
        chatType: string;
        groupName: string;
      }) => {
        await chatRepository.createChat(
          data.userId,
          data.participantIds,
          data.chatType,
          data.groupName
        );
      }
    );

    socket.on(
      "updateChat",
      async (data: {
        chatId: string;
        groupName: string;
        groupImage: string;
      }) => {
        await chatRepository.updateChat(
          data.chatId,
          data.groupName,
          data.groupImage
        );
      }
    );

    socket.on(
      "closeChatSupportTicket",
      async (data: { chatId: string; userId: string }) => {
        await chatRepository.closeChatSupport(data.chatId, data.userId);
      }
    );

    socket.on("changeTicketStatus", async (data) => {
      await chatRepository.changeTicketStatus(data.chatId, data.ticketStatus);
    });

    socket.on(
      "createChatSupport",
      async (data: { userId: string; topic: string }) => {
        await chatRepository.createChatSupport(data.userId, data.topic);
      }
    );

    socket.on("declineCall", (data: { chatId: string }) => {
      io.emit(`declineCall/${data.chatId}`, data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected.");
    });
  });
};

export class ChatService {
  private chatRepository: ChatRepository;
  private taskRepository: TaskRepository;
  private calendarRepository: CalendarRepository;
  private uploadHelper: UploadHelper;
  private walletRepository: WalletRepository;
  private notificationService: NotificationService;
  constructor() {
    this.chatRepository = new ChatRepository();
    this.taskRepository = new TaskRepository();
    this.calendarRepository = new CalendarRepository();
    this.uploadHelper = new UploadHelper("chat");
    this.walletRepository = new WalletRepository();
    this.notificationService = new NotificationService();
  }

  addRequest = async (
    _id: string,
    dataset: Partial<IRequest>,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      const userId = req?.locals?.auth?.userId!;
      let chat: IChat | any = await this.chatRepository.getOne({ _id });
      if (!chat) return ResponseHelper.sendResponse(404, "Chat not found");

      if (req && _.isArray(req.files)) {
        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "media")
        ) {
          const image = req.files?.filter((file) => file.fieldname === "media");
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          dataset.mediaUrl = path[0];
        }
      }

      dataset.createdBy = userId;
      const requestId = await this.chatRepository.subDocAction<IChat>(
        { _id },
        { $push: { requests: dataset } },
        { new: true }
      );
      const newRequest: IChat | any = await this.chatRepository.getOne({ _id });

      if (!requestId || !newRequest) {
        return ResponseHelper.sendResponse(404);
      }

      const newRequestId =
        newRequest.requests[newRequest.requests.length - 1]._id;
      let msg: IMessage = {
        body: "Request",
        sentBy: userId,
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
          await this.taskRepository.updateById<ITask>(chat?.task, {
            status: ETaskStatus.pause,
          });

          msg.type = MessageType.pause;
          break;

        case "3":
          msg.body = "Relieve";
          msg.type = MessageType.relieve;

          const tasks = await this.taskRepository.getById<ITask>(chat?.task);
          if (!tasks) return ResponseHelper.sendResponse(404, "Task not found");

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

            // Return the service provider unchanged if no conditions match
            return sp;
          });

          if (findStandByServiceProvider) {
            await this.notificationService.createAndSendNotification({
              ntitle: "your request has been accepted",
              nbody: "Relieve Action Request",
              receiverId: findStandByServiceProvider?.user,
              type: ENOTIFICATION_TYPES.ACTION_REQUEST,
              senderId: userId as string,
              data: {
                task: chat?.task?.toString(),
              },
            } as NotificationParams);
          }

          console.log(updatedServiceProviders, "updatedServiceProviders");
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

          await this.chatRepository.updateById<IChat>(chat._id, {
            participants: updatedParticipants,
          });

          break;

        case "4":
          msg.body = "Proceed";
          msg.type = MessageType.proceed;

          const taskUpdateResponse =
            await this.taskRepository.updateById<ITask>(chat?.task, {
              status: ETaskStatus.assigned,
            });

          if (taskUpdateResponse?.serviceProviders?.length) {
            const calendarEntries = taskUpdateResponse.serviceProviders.map(
              (provider: any) => ({
                user: provider.user as string,
                task: chat.task,
                date: dataset.date
                  ? dataset?.date.toISOString()
                  : new Date().toISOString(),
              })
            );
            await this.calendarRepository.createMany(calendarEntries);
          }
          break;

        case "5": {
          const taskId = chat?.task;
          const amount = dataset.amount || "0";
          const isServiceProviderInvoice =
            dataset.status === RequestStatus.SERVICE_PROVIDER_INVOICE_REQUEST;

          // Early return if amount is required but not provided
          if (!amount && isServiceProviderInvoice) {
            return ResponseHelper.sendResponse(404, "Amount is required");
          }

          // Set initial message properties
          msg.type = MessageType.invoice;
          msg.body = amount;
          if (dataset.mediaUrl) msg.mediaUrls = [dataset.mediaUrl];

          if (!taskId)
            return ResponseHelper.sendResponse(404, "Task id not found");

          // Fetch the task associated with the chat
          const task: ITask | null = await this.taskRepository.getById(taskId);
          if (!task) return ResponseHelper.sendResponse(404, "Task not found");

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

          // Validate amount
          const amount = Number(dataset.amount);
          if (isNaN(amount) || amount <= 0) {
            return ResponseHelper.sendResponse(404, "Amount is required");
          }

          // Fetch the completed task
          const completedTask = await this.taskRepository.getById<ITask>(
            chat?.task
          );
          if (!completedTask) {
            return ResponseHelper.sendResponse(404, "Task not found");
          }

          // Check if the task is commercial and validate the invoice amount
          if (completedTask.commercial) {
            if (
              completedTask.invoiceAmount === undefined ||
              amount <= completedTask.invoiceAmount
            ) {
              return ResponseHelper.sendResponse(
                404,
                "Amount should be greater than the invoice amount"
              );
            }

            // Fetch and validate user wallet
            const userWallet = await this.walletRepository.getOne<IWallet>({
              user: userId,
            });
            if (!userWallet) {
              return ResponseHelper.sendResponse(404, "Wallet not found");
            }
            if (userWallet.balance < amount) {
              return ResponseHelper.sendResponse(404, "Insufficient balance");
            }

            // Update user wallet balance and service provider balance using $inc
            const serviceProviderId = completedTask.serviceProviders[0]
              .user as string;
            await Promise.all([
              await this.walletRepository.updateByOne<IWallet>(
                { user: userId as string },
                {
                  $inc: {
                    amountHeld: -SERVICE_INITIATION_FEE,
                    balance: -(amount - SERVICE_INITIATION_FEE),
                  },
                }
              ),
              this.walletRepository.updateBalance(serviceProviderId, +amount),
            ]);
          }

          // Update task and calendar status
          await Promise.all([
            this.taskRepository.updateById<ITask>(chat?.task, {
              status: ETaskStatus.completed,
            }),
            this.calendarRepository.updateMany<ICalendar>(
              { task: new mongoose.Types.ObjectId(chat?.task) },
              { isActive: false }
            ),
          ]);

          break;
        }

        default:
          break;
      }

      newRequest?.participants?.forEach((participant: IParticipant) => {
        this.notificationService.createAndSendNotification({
          ntitle: `${msg.body} Action Request`,
          nbody: msg.body,
          receiverId: participant.user,
          type: ENOTIFICATION_TYPES.ACTION_REQUEST,
          senderId: userId as string,
          data: {
            task: chat?.task?.toString(),
          },
        } as NotificationParams);
      });

      const response = await this.chatRepository.subDocAction<IChat>(
        { _id },
        { $push: { messages: msg } },
        { new: true }
      );

      await this.chatRepository.sendMessages(
        _id,
        newRequest.participants,
        msg,
        userId
      );

      if (!response) {
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

  getChats = async (
    userId: string,
    page?: number,
    pageSize: number = 20,
    chatSupport?: boolean,
    search?: string | undefined
  ): Promise<ApiResponse> => {
    try {
      const response = await this.chatRepository.getAllChats(
        userId,
        page,
        pageSize,
        chatSupport,
        null,
        search
      );
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  chatDetails = async (
    chatId: string | null | undefined,
    user: string,
    chatSupport: boolean
  ): Promise<ApiResponse> => {
    try {
      const response = await this.chatRepository.getChats(
        user,
        1,
        20,
        chatSupport,
        chatId,
        ""
      );

      if (!response) {
        return ResponseHelper.sendResponse(404, "Chat not found");
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}
