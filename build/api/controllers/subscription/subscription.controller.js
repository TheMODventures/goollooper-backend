"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = __importDefault(require("../../services/subscription.service"));
class SubscriptionController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, name = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                name: { $regex: name, $options: "i" },
                isDeleted: false,
            };
            const response = await this.subscriptionService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.subscriptionService.create(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.subscriptionService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.subscriptionService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.subscriptionService.delete(id);
            return res.status(response.code).json(response);
        };
        // plans
        this.addPlan = async (req, res) => {
            const { subscriptionId } = req.params;
            const payload = { ...req.body };
            const response = await this.subscriptionService.addPlan(subscriptionId, payload);
            return res.status(response.code).json(response);
        };
        this.updatePlan = async (req, res) => {
            const { subscriptionId, id } = req.params;
            const dataset = { ...req.body };
            const response = await this.subscriptionService.updatePlan(subscriptionId, id, dataset);
            return res.status(response.code).json(response);
        };
        this.deletePlan = async (req, res) => {
            const { subscriptionId, id } = req.params;
            const response = await this.subscriptionService.removePlan(subscriptionId, id);
            return res.status(response.code).json(response);
        };
        this.subscriptionService = new subscription_service_1.default();
    }
}
exports.default = SubscriptionController;
//# sourceMappingURL=subscription.controller.js.map