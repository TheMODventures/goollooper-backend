"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const guideline_controller_1 = __importDefault(require("../../controllers/guideline/guideline.controller"));
const base_route_1 = __importDefault(require("../base.route"));
class GuidelineRoutes extends base_route_1.default {
    constructor() {
        super();
        this.guidelineController = new guideline_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "guideline");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.guidelineController.index);
        this.router.post("/create", this.validateRequest, this.guidelineController.create);
        this.router.patch("/update/:id", this.validateRequest, this.guidelineController.update);
    }
}
exports.default = GuidelineRoutes;
//# sourceMappingURL=guideline.route.js.map