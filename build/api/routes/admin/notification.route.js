"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const notification_controller_1 = __importDefault(require("../../controllers/notification/notification.controller"));
const base_route_1 = __importDefault(require("../base.route"));
class NotificationRoutes extends base_route_1.default {
    constructor() {
        super();
        this.notificationController = new notification_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "notification");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.notificationController.getAll);
        this.router.post("/send", this.validateRequest, this.notificationController.createAndSendNotificationMultiple);
    }
}
exports.default = NotificationRoutes;
//# sourceMappingURL=notification.route.js.map