import { NextFunction, Request, Response } from "express";
import { Validation } from "../../middleware/validation.middleware";
import WalletController from "../controllers/wallet/wallet.controller";
import BaseRoutes from "./base.route";
import { validateFiles } from "../../validator/userFile.validate";
import multer from "multer";

class WalletRoutes extends BaseRoutes {
  private walletController: WalletController;
  private validateRequest;

  constructor() {
    super();
    this.walletController = new WalletController();
    this.validateRequest = new Validation().reporter(true, "wallet");
    this.initializeRoutes();
  }

  private validateFilesMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const fields = ["identityDocumentFront", "identityDocumentBack"];

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
      "/create",
      multer().any(),
      this.validateFilesMiddleware,
      this.validateRequest,
      this.walletController.create
    );

    this.router.get("/show", this.validateRequest, this.walletController.show);

    this.router.patch(
      "/default-payment-method",
      this.validateRequest,
      this.walletController.defaultPaymentMethod
    );

    // this.router.delete(
    //   "/delete/:id",
    //   this.validateRequest,
    //   this.walletController.delete
    // );
  }
}

export default WalletRoutes;
