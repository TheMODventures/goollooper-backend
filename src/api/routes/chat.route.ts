import multer from "multer";
import { Request, Response, NextFunction } from "express";

import { Validation } from "../../middleware/validation.middleware";
import { validateFiles } from "../../validator/userFile.validate";
import ChatController from "../controllers/chat/chat.controller";
import BaseRoutes from "./base.route";

class ChatRoutes extends BaseRoutes {
  private chatController: ChatController;
  private validateRequest;

  constructor() {
    super();
    this.chatController = new ChatController();
    this.validateRequest = new Validation().reporter(true, "chat");
    this.initializeRoutes();
  }

  private validateFilesMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const fields = ["media"];

      fields.forEach((field) => {
        const files = (req.files as Express.Multer.File[])?.filter(
          (file) => file.fieldname === field
        );
        if (files) {
          validateFiles(files, field, res);
        }
      });
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  protected routes(): void {
    this.router.patch(
      "/request/:id",
      multer().any(),
      this.validateFilesMiddleware,
      this.validateRequest,
      this.chatController.addRequest
    );
  }
}

export default ChatRoutes;
