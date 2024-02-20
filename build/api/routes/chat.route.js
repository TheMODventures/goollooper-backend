"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const userFile_validate_1 = require("../../validator/userFile.validate");
const chat_controller_1 = __importDefault(require("../controllers/chat/chat.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class ChatRoutes extends base_route_1.default {
    constructor() {
        super();
        this.validateFilesMiddleware = (req, res, next) => {
            try {
                const fields = ["media"];
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
        this.chatController = new chat_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "chat");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.chatController.index);
        this.router.patch("/request/:id", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.validateRequest, this.chatController.addRequest);
        this.router.patch("/call/token/:id", this.validateRequest, this.chatController.updateCallToken);
        this.router.post("/call/get-agora-token", this.chatController.getAgoraToken);
        this.router.post("/call/end", this.chatController.endCall);
    }
}
exports.default = ChatRoutes;
//# sourceMappingURL=chat.route.js.map