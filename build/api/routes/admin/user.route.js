"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const user_controller_1 = __importDefault(require("../../controllers/user/user.controller"));
const base_route_1 = __importDefault(require("../base.route"));
class UserRoutes extends base_route_1.default {
    constructor() {
        super();
        this.userController = new user_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "user");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.userController.index);
    }
}
exports.default = UserRoutes;
//# sourceMappingURL=user.route.js.map