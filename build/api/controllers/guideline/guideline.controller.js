"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const guideline_service_1 = __importDefault(require("../../services/guideline.service"));
class GuidelineController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, name = "", type } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
            // name: { $regex: name, $options: "i" },
            };
            if (type)
                filter.type = Number(type);
            const response = await this.guidelineService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.guidelineService.create(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.guidelineService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.guidelineService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.guidelineService.delete(id);
            return res.status(response.code).json(response);
        };
        this.guidelineService = new guideline_service_1.default();
    }
}
exports.default = GuidelineController;
//# sourceMappingURL=guideline.controller.js.map