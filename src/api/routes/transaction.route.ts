import { Validation } from "../../middleware/validation.middleware";
import TransactionController from "../controllers/transaction/transaction.controller";
import BaseRoutes from "./base.route";

class TransactionRoutes extends BaseRoutes {
  private transactionController: TransactionController;
  private validateRequest;

  constructor() {
    super();
    this.transactionController = new TransactionController();
    this.validateRequest = new Validation().reporter(true, "transaction");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get(
      "/",
      this.validateRequest,
      this.transactionController.index
    );
    this.router.get(
      "/show/:id",
      this.validateRequest,
      this.transactionController.show
    );
    this.router.post(
      "/create",
      this.validateRequest,
      this.transactionController.create
    );
    // this.router.patch(
    //   "/update/:id",
    //   this.validateRequest,
    //   this.transactionController.update
    // );
    this.router.delete(
      "/delete/:id",
      this.validateRequest,
      this.transactionController.delete
    );
  }
}

export default TransactionRoutes;
