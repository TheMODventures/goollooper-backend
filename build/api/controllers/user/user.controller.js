"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const user_service_1 = __importDefault(require("../../services/user.service"));
const schedule_service_1 = __importDefault(require("../../services/schedule.service"));
const enums_1 = require("../../../database/interfaces/enums");
class UserController {
    constructor() {
        this.checkUsername = async (req, res) => {
            const filter = {
                username: req.body.username,
                isDeleted: false,
            };
            const response = await this.userService.getByFilter(filter);
            return res
                .status(response.code)
                .json({ available: response.data ? false : true });
        };
        this.index = async (req, res) => {
            const { limit, page, username = "", email = "", role } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                $or: [{ role: enums_1.EUserRole.user }, { role: enums_1.EUserRole.serviceProvider }],
                email: { $regex: email, $options: "i" },
                isDeleted: false,
            };
            if (username) {
                filter.username = { $regex: username, $options: "i" };
            }
            if (role) {
                filter.role = { $eq: role };
            }
            const response = await this.userService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.trashIndex = async (req, res) => {
            const { limit, page } = req.query;
            const limitNow = limit ? limit : 10;
            const response = await this.userService.trashIndex(Number(page), Number(limitNow));
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.userService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            let data = { ...req.body };
            if (data?.firstName && data?.username) {
                data.isProfileCompleted = true;
            }
            const response = await this.userService.update(id, data, req);
            return res.status(response.code).json(response);
        };
        this.updateSchedule = async (req, res) => {
            const { id } = req.params;
            let data = { ...req.body };
            const response = await this.scheduleService.update(id, data);
            return res.status(response.code).json(response);
        };
        this.trash = async (req, res) => {
            const { _id } = req.params;
            const dataset = {
                deletedAt: (0, moment_1.default)(),
            };
            const response = await this.userService.update(_id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const userId = req?.locals?.auth?.userId;
            const response = await this.userService.delete(userId);
            return res.status(response.code).json(response);
        };
        this.restore = async (req, res) => {
            const { _id } = req.params;
            const dataset = {
                deletedAt: null,
            };
            const response = await this.userService.update(_id, dataset);
            return res.status(response.code).json(response);
        };
        this.getSubAdmin = async (req, res) => {
            const { limit, page, username = "", email = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                role: enums_1.EUserRole.subAdmin,
                email: { $regex: email, $options: "i" },
                isDeleted: false,
            };
            if (username) {
                filter.username = { $regex: username, $options: "i" };
            }
            const response = await this.userService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.addSubAdmin = async (req, res) => {
            const response = await this.userService.addSubAdmin(req.body);
            return res.status(response.code).json(response);
        };
        this.deleteSubAdmin = async (req, res) => {
            const { id } = req.params;
            const response = await this.userService.delete(id);
            return res.status(response.code).json(response);
        };
        this.userService = new user_service_1.default();
        this.scheduleService = new schedule_service_1.default();
    }
}
exports.default = UserController;
//# sourceMappingURL=user.controller.js.map