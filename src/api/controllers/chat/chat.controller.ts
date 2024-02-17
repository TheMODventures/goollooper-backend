import { Request, Response } from "express";

import { IChat } from "../../../database/interfaces/chat.interface";
import { ChatService } from "../../services/chat.service";
import { ChatRepository } from "../../repository/chat/chat.repository";

class ChatController {
  protected chatService: ChatService;
  protected chatRepository: ChatRepository;

  constructor() {
    this.chatService = new ChatService();
    this.chatRepository = new ChatRepository();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, chatSupport = false, search } = req.query;
    const limitNow = limit ? limit : 10;
    const response = await this.chatService.getChats(
      req.locals.auth?.userId as any,
      Number(page),
      Number(limitNow),
      chatSupport as boolean,
      search as string
    );
    return res.status(response.code).json(response);
  };

  addRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IChat> = { ...req.body };

    const response = await this.chatService.addRequest(id, dataset, req);
    return res.status(response.code).json(response);
  };

  getAgoraToken = async (req: Request, res: Response) => {
    const response = await this.chatRepository.getAgoraToken(req);
    return res.status(response.code).json(response);
  };

  endCall = async (req: Request, res: Response) => {
    const response = await this.chatRepository.endCall(req);
    return res.status(response.code).json(response);
  };

  updateCallToken = async (req: Request, res: Response) => {
    const response = await this.chatRepository.updateCallToken(req);
    return res.status(response.code).json(response);
  };
}

export default ChatController;
