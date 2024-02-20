"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const base_route_1 = __importDefault(require("./base.route"));
const task_controller_1 = __importDefault(require("../controllers/task/task.controller"));
const userFile_validate_1 = require("../../validator/userFile.validate");
class TaskRoutes extends base_route_1.default {
    constructor() {
        super();
        this.validateFilesMiddleware = (req, res, next) => {
            try {
                const fields = ["media", "subTaskMedia"];
                fields.forEach((field) => {
                    const files = req.files?.filter((file) => file.fieldname === field);
                    if (files) {
                        (0, userFile_validate_1.validateFiles)(files, field, res);
                    }
                });
                next();
            }
            catch (error) {
                res.status(500).json({ error: "Internal Server Error" });
            }
        };
        this.taskController = new task_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "task");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.taskController.index);
        this.router.get("/my-task", this.validateRequest, this.taskController.myTasks);
        this.router.get("/show/:id", this.validateRequest, this.taskController.show);
        this.router.post("/create", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.validateRequest, this.taskController.create);
        this.router.patch("/update/:id", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.validateRequest, this.taskController.update);
        this.router.delete("/delete/:id", this.validateRequest, this.taskController.delete);
        this.router.put("/request/:id", this.validateRequest, this.taskController.requestToAdded);
        this.router.put("/toggle-request/:id", this.validateRequest, this.taskController.toggleRequest);
    }
}
exports.default = TaskRoutes;
//# sourceMappingURL=task.route.js.map