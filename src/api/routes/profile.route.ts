import multer from "multer";
import { Request, Response, NextFunction } from "express";

import { validateFiles } from "../../validator/userFile.validate";
import { Validation } from "../../middleware/validation.middleware";
import UserController from "../controllers/user/user.controller";
import BaseRoutes from "./base.route";

class ProfileRoutes extends BaseRoutes {
  private userController: UserController;

  private validateRequest;

  constructor() {
    super();
    this.userController = new UserController();
    this.validateRequest = new Validation().reporter(true, "user");
    this.initializeRoutes();
  }

  private validateFilesMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const fields = [
        "profileImage",
        "gallery",
        "visuals",
        "companyLogo",
        "companyResume",
        "certificates",
        "licenses",
        "insurances",
      ];

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
      "/check-username",
      this.validateRequest,
      this.userController.checkUsername
    );
    this.router.get("/", this.validateRequest, this.userController.index);
    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.userController.show
    );
    this.router.patch(
      "/update/:id",
      multer().any(),
      this.validateFilesMiddleware,
      this.validateRequest,
      this.userController.update
    );
    this.router.delete(
      "/delete/:_id",
      this.validateRequest,
      this.userController.delete
    );
  }
}

export default ProfileRoutes;