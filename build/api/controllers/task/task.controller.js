"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const task_service_1 = __importDefault(require("../../services/task.service"));
class TaskController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, title = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const response = await this.taskService.index(req.body.taskInterests, req.locals.auth?.userId, Number(page), Number(limitNow), title);
            return res.status(response.code).json(response);
        };
        this.myTasks = async (req, res) => {
            const { limit, page, type } = req.query;
            const limitNow = limit ? limit : 10;
            const response = await this.taskService.myTasks(Number(page), Number(limitNow), type, req.locals.auth?.userId);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.taskService.create(payload, req);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.taskService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.taskService.update(id, dataset, req);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.taskService.delete(id);
            return res.status(response.code).json(response);
        };
        this.requestToAdded = async (req, res) => {
            const { id } = req.params;
            const response = await this.taskService.requestToAdded(id, req.locals.auth?.userId);
            console.log(id);
            return res.status(response.code).json(response);
        };
        this.toggleRequest = async (req, res) => {
            const { id } = req.params;
            const { user, status, type } = req.body;
            const response = await this.taskService.toggleRequest(id, req.locals.auth?.userId, user, status, type);
            return res.status(response.code).json(response);
        };
        this.taskService = new task_service_1.default();
    }
}
exports.default = TaskController;
//# sourceMappingURL=task.controller.js.map