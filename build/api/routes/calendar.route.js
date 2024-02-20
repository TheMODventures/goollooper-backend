"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const calendar_controller_1 = __importDefault(require("../controllers/calendar/calendar.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class CalendarRoutes extends base_route_1.default {
    constructor() {
        super();
        this.calendarController = new calendar_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "calendar");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.calendarController.index);
        this.router.post("/create", this.validateRequest, this.calendarController.create);
        this.router.get("/show/:id", this.validateRequest, this.calendarController.show);
        this.router.patch("/update/:id", this.validateRequest, this.calendarController.update);
        this.router.delete("/delete/:id", this.validateRequest, this.calendarController.delete);
    }
}
exports.default = CalendarRoutes;
//# sourceMappingURL=calendar.route.js.map