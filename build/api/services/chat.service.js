"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const lodash_1 = __importDefault(require("lodash"));
const constant_1 = require("../../constant");
const chat_repository_1 = require("../repository/chat/chat.repository");
const task_repository_1 = require("../repository/task/task.repository");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const upload_helper_1 = require("../helpers/upload.helper");
const enums_1 = require("../../database/interfaces/enums");
let clients = {};
exports.default = (io) => {
    console.log("Chat Socket Initialized");
    const chatRepository = new chat_repository_1.ChatRepository(io);
    const authorize = new authorize_middleware_1.Authorize();
    io.use(async (socket, next) => {
        const token = socket.handshake.query.token;
        const result = await authorize.validateAuthSocket(token);
        if (result?.userId) {
            socket.user = result;
            next();
        }
        else
            next(new Error(result));
    });
    io.on("connection", async (socket) => {
        console.log(`Active Clients ${Object.keys(clients).length}`);
        socket.on("getChats", async (data) => {
            clients[data.userId] = socket.id;
            await chatRepository.getChats(data.userId, data.page ?? 0, 20, data.chatSupport ?? false, null, data.search);
        });
        socket.on("getChatMessages", async (data) => {
            clients[data.userId] = socket.id;
            await chatRepository.getChatMessages(data.chatId, data.userId, data.page ?? 0);
        });
        socket.on("sendMessage", async (data) => {
            try {
                //   const validator = await validation(
                //     chatValidation,
                //     true
                //   )({ body: data });
                //   if (validator) {
                await chatRepository.createMessage(data.chatId, data.userId, data.messageBody, data.mediaUrls, data.name);
                //   } else throw validator;
            }
            catch (error) {
                console.error("Error while sending chat:", error);
                socket.emit(`error/${data.userId}`, "validation error while sending chat");
            }
        });
        socket.on("deleteMessages", async (data) => {
            console.log("deleteMessages executed");
            await chatRepository.deleteAllMessage(data.chatId, data.userId);
        });
        socket.on("deleteSelectedMessages", async (data) => {
            console.log("deleteSelectedMessages executed");
            await chatRepository.deleteSelectedMessage(data.chatId, data.userId);
        });
        socket.on("readMessages", async (data) => {
            await chatRepository.readAllMessages(data.chatId, data.userId);
        });
        socket.on("updateBlockStatus", async (data) => {
            await chatRepository.updateBlockStatus(data);
        });
        socket.on("createChat", async (data) => {
            await chatRepository.createChat(data.userId, data.participantIds, data.chatType, data.groupName);
        });
        socket.on("updateChat", async (data) => {
            await chatRepository.updateChat(data.chatId, data.groupName, data.groupImage);
        });
        socket.on("closeChatSupportTicket", async (data) => {
            await chatRepository.closeChatSupport(data.chatId, data.userId);
        });
        socket.on("changeTicketStatus", async (data) => {
            await chatRepository.changeTicketStatus(data.chatId, data.ticketStatus);
        });
        socket.on("createChatSupport", async (data) => {
            await chatRepository.createChatSupport(data.userId, data.topic);
        });
        socket.on("declineCall", (data) => {
            io.emit(`declineCall/${data.chatId}`, data);
        });
        socket.on("disconnect", () => {
            console.log("A user disconnected.");
        });
    });
};
class ChatService {
    constructor() {
        this.addRequest = async (_id, dataset, req) => {
            try {
                const userId = req?.locals?.auth?.userId;
                let chat = await this.chatRepository.getOne({ _id });
                if (!chat)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Chat not found");
                if (req && lodash_1.default.isArray(req.files)) {
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "media")) {
                        const image = req.files?.filter((file) => file.fieldname === "media");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        dataset.mediaUrl = path[0];
                    }
                }
                dataset.createdBy = userId;
                const requestId = await this.chatRepository.subDocAction({ _id }, { $push: { requests: dataset } }, { new: true });
                const newRequest = await this.chatRepository.getOne({ _id });
                if (!requestId || !newRequest) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                const newRequestId = newRequest.requests[newRequest.requests.length - 1]._id;
                let msg = {
                    body: "Request",
                    sentBy: _id,
                    requestId: newRequestId,
                };
                switch (dataset.type?.toString()) {
                    case "1":
                        msg.type = enums_1.MessageType.request;
                        if (dataset.mediaUrl) {
                            msg.body = "This is my Request";
                            msg.mediaUrls = [dataset.mediaUrl];
                        }
                        break;
                    case "2":
                        msg.body = "Pause";
                        msg.type = enums_1.MessageType.pause;
                        break;
                    case "3":
                        msg.body = "Relieve";
                        msg.type = enums_1.MessageType.relieve;
                        break;
                    case "4":
                        msg.body = "Proceed";
                        msg.type = enums_1.MessageType.proceed;
                        await this.taskRepository.updateById(chat?.task, {
                            status: enums_1.ETaskStatus.assigned,
                        });
                        break;
                    case "5":
                        msg.type = enums_1.MessageType.invoice;
                        if (!dataset.amount)
                            return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Amount is required");
                        if (dataset.mediaUrl) {
                            msg.body = dataset.amount;
                            msg.mediaUrls = [dataset.mediaUrl];
                        }
                        await this.taskRepository.updateById(chat?.task, {
                            status: enums_1.ETaskStatus.completed,
                        });
                        break;
                    default:
                        break;
                }
                const response = await this.chatRepository.subDocAction({ _id }, { $push: { messages: msg } }, { new: true });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.getChats = async (userId, page, pageSize = 20, chatSupport, search) => {
            try {
                const response = await this.chatRepository.getAllChats(userId, page, pageSize, chatSupport, null, search);
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.chatRepository = new chat_repository_1.ChatRepository();
        this.taskRepository = new task_repository_1.TaskRepository();
        this.uploadHelper = new upload_helper_1.UploadHelper("chat");
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map