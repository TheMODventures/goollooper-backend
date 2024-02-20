"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_service_1 = require("../../services/chat.service");
const chat_repository_1 = require("../../repository/chat/chat.repository");
class ChatController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, chatSupport = false, search } = req.query;
            const limitNow = limit ? limit : 10;
            const response = await this.chatService.getChats(req.locals.auth?.userId, Number(page), Number(limitNow), chatSupport, search);
            return res.status(response.code).json(response);
        };
        this.addRequest = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.chatService.addRequest(id, dataset, req);
            return res.status(response.code).json(response);
        };
        this.getAgoraToken = async (req, res) => {
            const response = await this.chatRepository.getAgoraToken(req);
            return res.status(response.code).json(response);
        };
        this.endCall = async (req, res) => {
            const response = await this.chatRepository.endCall(req);
            return res.status(response.code).json(response);
        };
        this.updateCallToken = async (req, res) => {
            const response = await this.chatRepository.updateCallToken(req);
            return res.status(response.code).json(response);
        };
        this.chatService = new chat_service_1.ChatService();
        this.chatRepository = new chat_repository_1.ChatRepository();
    }
}
exports.default = ChatController;
//# sourceMappingURL=chat.controller.js.map