"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const state_service_1 = __importDefault(require("../../services/state.service"));
const city_service_1 = __importDefault(require("../../services/city.service"));
const county_service_1 = __importDefault(require("../../services/county.service"));
class StateController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, name = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                name: { $regex: name, $options: "i" },
            };
            const response = await this.stateService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.getCities = async (req, res) => {
            const { limit, page, name = "", stateId = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                name: { $regex: name, $options: "i" },
            };
            if (stateId) {
                filter.state = stateId;
            }
            const response = await this.cityService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.getCounties = async (req, res) => {
            const { limit, page, name = "", stateId = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                name: { $regex: name, $options: "i" },
            };
            if (stateId) {
                filter.state = stateId;
            }
            const response = await this.countyService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.stateService.create(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.stateService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.stateService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.stateService.delete(id);
            return res.status(response.code).json(response);
        };
        this.stateService = new state_service_1.default();
        this.cityService = new city_service_1.default();
        this.countyService = new county_service_1.default();
    }
}
exports.default = StateController;
//# sourceMappingURL=state.controller.js.map