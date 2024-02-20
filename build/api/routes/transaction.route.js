"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const transaction_controller_1 = __importDefault(require("../controllers/transaction/transaction.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class TransactionRoutes extends base_route_1.default {
    constructor() {
        super();
        this.transactionController = new transaction_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "transaction");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.transactionController.index);
        this.router.get("/show/:id", this.validateRequest, this.transactionController.show);
        this.router.post("/create", this.validateRequest, this.transactionController.create);
        this.router.patch("/update/:id", this.validateRequest, this.transactionController.update);
        // this.router.delete(
        //   "/delete/:id",
        //   this.validateRequest,
        //   this.transactionController.delete
        // );
    }
}
exports.default = TransactionRoutes;
//# sourceMappingURL=transaction.route.js.map