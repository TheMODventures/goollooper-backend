"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = __importDefault(require("../../services/notification.service"));
const model_helper_1 = require("../../helpers/model.helper");
class NotificationController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page = 1 } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                // name: { $regex: name, $options: "i" },
                receiver: req.locals.auth?.userId,
            };
            const response = await this.notificationService.index(Number(page), Number(limitNow), filter, [
                model_helper_1.ModelHelper.populateData("sender", model_helper_1.ModelHelper.userSelect, "Users"),
                model_helper_1.ModelHelper.populateData("data.serviceProvider", model_helper_1.ModelHelper.userSelect, "Users", [
                    model_helper_1.ModelHelper.populateData("subscription.subscription", model_helper_1.ModelHelper.subscriptionSelect),
                ]),
            ]);
            response.data.result = response.data.result.map((e) => {
                return {
                    ...e,
                    content: e.content
                        .replace("#sender", e.sender?.firstName ?? e.sender?.email ?? "")
                        .replace("#receiver", ""),
                };
            });
            return res.status(response.code).json(response);
        };
        this.getAll = async (req, res) => {
            const { limit, page = 1 } = req.query;
            const limitNow = limit ? limit : 10;
            const response = await this.notificationService.index(Number(page), Number(limitNow), {});
            response.data.result = response.data.result.map((e) => {
                return {
                    ...e,
                    content: e.content
                        .replace("#sender", e.sender?.firstName ?? e.sender?.email ?? "")
                        .replace("#receiver", ""),
                };
            });
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.notificationService.create(payload);
            return res.status(response.code).json(response);
        };
        this.createAndSendNotificationMultiple = async (req, res) => {
            const response = await this.notificationService.createAndSendNotificationMultiple(req.body, req.locals.auth?.userId);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.notificationService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.notificationService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.notificationService.delete(id);
            return res.status(response.code).json(response);
        };
        this.notificationService = new notification_service_1.default();
    }
}
exports.default = NotificationController;
//# sourceMappingURL=notification.controller.js.map