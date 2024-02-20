"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_service_1 = __importDefault(require("../../services/service.service"));
class ServiceController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, title = "", type = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                title: { $regex: title, $options: "i" },
                type: { $regex: type },
                isDeleted: false,
            };
            const response = await this.serviceService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.serviceService.create(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.serviceService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.serviceService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.serviceService.delete(id);
            return res.status(response.code).json(response);
        };
        this.serviceService = new service_service_1.default();
    }
}
exports.default = ServiceController;
//# sourceMappingURL=service.controller.js.map