"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRepository = void 0;
const task_model_1 = require("../../../database/models/task.model");
const base_repository_1 = require("../base.repository");
class TaskRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(task_model_1.Task);
        this.exists = async (filter) => {
            return (await task_model_1.Task.exists(filter)) != null;
        };
    }
}
exports.TaskRepository = TaskRepository;
//# sourceMappingURL=task.repository.js.map