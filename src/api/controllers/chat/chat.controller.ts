import { Request, Response } from "express";

import { IChat } from "../../../database/interfaces/chat.interface";
import { ChatService } from "../../services/chat.service";

class ChatController {
  protected chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  addRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IChat> = { ...req.body };

    const response = await this.chatService.addRequest(id, dataset, req);
    return res.status(response.code).json(response);
  };
}

export default ChatController;
