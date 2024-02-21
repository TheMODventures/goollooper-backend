import { Request, Response, NextFunction } from "express";
import multer from "multer";

import MediaController from "../../controllers/media/media.controller";
import { validateFiles } from "../../../validator/userFile.validate";
import BaseRoutes from "../base.route";

class MediaRoutes extends BaseRoutes {
  private mediaController: MediaController;

  constructor() {
    super();
    this.mediaController = new MediaController();
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
    this.router.post(
      "/upload",
      multer().any(),
      this.validateFilesMiddleware,
      this.mediaController.upload
    );
  }
}

export default MediaRoutes;
