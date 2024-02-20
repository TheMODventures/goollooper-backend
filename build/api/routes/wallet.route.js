"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const wallet_controller_1 = __importDefault(require("../controllers/wallet/wallet.controller"));
const base_route_1 = __importDefault(require("./base.route"));
const userFile_validate_1 = require("../../validator/userFile.validate");
const multer_1 = __importDefault(require("multer"));
class WalletRoutes extends base_route_1.default {
    constructor() {
        super();
        this.validateFilesMiddleware = (req, res, next) => {
            try {
                const fields = ["identityDocumentFront", "identityDocumentBack"];
                fields.forEach((field) => {
                    const files = req.files?.filter((file) => file.fieldname === field);
                    if (files) {
                        (0, userFile_validate_1.validateFiles)(files, field, res);
                    }
                });
                next();
            }
            catch (error) {
                res.status(500).json({ error: "Internal Server Error" });
            }
        };
        this.walletController = new wallet_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "wallet");
        this.initializeRoutes();
    }
    routes() {
        this.router.post("/create", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.validateRequest, this.walletController.create);
        this.router.get("/show", this.validateRequest, this.walletController.show);
        this.router.patch("/default-payment-method", this.validateRequest, this.walletController.defaultPaymentMethod);
        // this.router.delete(
        //   "/delete/:id",
        //   this.validateRequest,
        //   this.walletController.delete
        // );
    }
}
exports.default = WalletRoutes;
//# sourceMappingURL=wallet.route.js.map