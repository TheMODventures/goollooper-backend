"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const state_controller_1 = __importDefault(require("../controllers/state/state.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class StateRoutes extends base_route_1.default {
    constructor() {
        super();
        this.stateController = new state_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "location");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/states", this.validateRequest, this.stateController.index);
        this.router.get("/cities", this.validateRequest, this.stateController.getCities);
        this.router.get("/counties", this.validateRequest, this.stateController.getCounties);
        // this.router.post(
        //   "/populate-data",
        //   multer().single("file"),
        //   this.validateRequest,
        //   this.stateController.populateData
        // );
    }
}
exports.default = StateRoutes;
//# sourceMappingURL=state.route.js.map