import { Validation } from "../../middleware/validation.middleware";
import WalletController from "../controllers/wallet/wallet.controller";
import BaseRoutes from "./base.route";

class WalletRoutes extends BaseRoutes {
  private walletController: WalletController;
  private validateRequest;

  constructor() {
    super();
    this.walletController = new WalletController();
    this.validateRequest = new Validation().reporter(true, "wallet");
    this.initializeRoutes();
  }

  protected routes(): void {
    // this.router.post(
    //   "/create",
    //   this.validateRequest,
    //   this.walletController.create
    // );

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
