import * as SocketIO from "socket.io";
import { Request } from "express";
import _ from "lodash";

import { SUCCESS_DATA_UPDATION_PASSED } from "../../constant";
import {
  IChat,
  IMessage,
  IRequest,
} from "../../database/interfaces/chat.interface";
import { ChatRepository } from "../repository/chat/chat.repository";
import { Authorize } from "../../middleware/authorize.middleware";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { UploadHelper } from "../helpers/upload.helper";
import { MessageType } from "../../database/interfaces/enums";

interface CustomSocket extends SocketIO.Socket {
  user?: any; // Adjust the type according to your user structure
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
          null,
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
          //   const validator = await validation(
          //     chatValidation,
          //     true
          //   )({ body: data });
          //   if (validator) {
          await chatRepository.createMessage(
            data.chatId,
            data.userId,
            data.messageBody,
            data.mediaUrls,
            data.name
          );
          //   } else throw validator;
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
  private uploadHelper: UploadHelper;

  constructor() {
    this.chatRepository = new ChatRepository();

    this.uploadHelper = new UploadHelper("chat");
  }

  addRequest = async (
    _id: string,
    dataset: Partial<IRequest>,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      const userId = req?.locals?.auth?.userId!;
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

      let msg: IMessage = {
        body: "Request",
        sentBy: _id,
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
          break;

        case "3":
          msg.body = "Relieve";
          msg.type = MessageType.relieve;
          break;

        case "4":
          msg.body = "Proceed";
          msg.type = MessageType.proceed;
          break;

        case "5":
          msg.type = MessageType.invoice;
          if (!dataset.amount)
            return ResponseHelper.sendResponse(404, "Amount is required");
          if (dataset.mediaUrl) {
            msg.body = dataset.amount;
            msg.mediaUrls = [dataset.mediaUrl];
          }
          break;

        default:
          break;
      }

      dataset.createdBy = userId;
      const response = await this.chatRepository.subDocAction<IChat>(
        { _id },
        { $push: { requests: dataset, messages: msg } },
        { new: true }
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
}
