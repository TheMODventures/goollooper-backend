"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rating_controller_1 = __importDefault(require("../controllers/rating/rating.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class RatingRoutes extends base_route_1.default {
    constructor() {
        super();
        this.ratingController = new rating_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "rating");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/:user", this.validateRequest, this.ratingController.index);
        this.router.post("/create", this.validateRequest, this.ratingController.create);
        this.router.post("/create/multiple", this.validateRequest, this.ratingController.createMultiple);
    }
}
exports.default = RatingRoutes;
//# sourceMappingURL=rating.route.js.map