"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../../services/user.service"));
const task_service_1 = __importDefault(require("../../services/task.service"));
const enums_1 = require("../../../database/interfaces/enums");
class StatsController {
    constructor() {
        this.index = async (req, res) => {
            const userCount = await this.userService.getCount({
                role: { $in: [enums_1.EUserRole.user, enums_1.EUserRole.serviceProvider] },
            });
            const taskCount = await this.taskService.getCount();
            const response = {
                code: 200,
                data: {
                    userCount: userCount.data,
                    taskCount: taskCount.data,
                },
                message: "Success",
            };
            return res.status(response.code).json(response);
        };
        this.userService = new user_service_1.default();
        this.taskService = new task_service_1.default();
    }
}
exports.default = StatsController;
//# sourceMappingURL=stats.controller.js.map