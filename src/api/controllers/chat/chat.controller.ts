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
