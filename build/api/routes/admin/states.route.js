"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stats_controller_1 = __importDefault(require("../../controllers/stats/stats.controller"));
const base_route_1 = __importDefault(require("../base.route"));
class StatsRoutes extends base_route_1.default {
    constructor() {
        super();
        this.statsController = new stats_controller_1.default();
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.statsController.index);
    }
}
exports.default = StatsRoutes;
//# sourceMappingURL=states.route.js.map