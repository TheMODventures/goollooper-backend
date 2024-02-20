"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const user_controller_1 = __importDefault(require("../../controllers/user/user.controller"));
const base_route_1 = __importDefault(require("../base.route"));
class SubAdminRoutes extends base_route_1.default {
    constructor() {
        super();
        this.userController = new user_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "subadmin");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.userController.getSubAdmin);
        this.router.get("/:id", this.validateRequest, this.userController.show);
        this.router.post("/create", this.validateRequest, this.userController.addSubAdmin);
        this.router.post("/update/:id", this.validateRequest, this.userController.update);
        this.router.delete("/delete/:id", this.validateRequest, this.userController.deleteSubAdmin);
    }
}
exports.default = SubAdminRoutes;
//# sourceMappingURL=subadmin.route.js.map