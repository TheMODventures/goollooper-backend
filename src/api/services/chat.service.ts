import * as SocketIO from "socket.io";

import { ChatRepository } from "../repository/chat/chat.repository";
import { Authorize } from "../../middleware/authorize.middleware";
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
      }) => {
        clients[data.userId] = socket.id;
        await chatRepository.getChats(
          data.userId,
          data.page ?? 0,
          20,
          data.chatSupport ?? false
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
