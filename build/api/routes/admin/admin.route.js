"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorize_middleware_1 = require("../../../middleware/authorize.middleware");
const base_route_1 = __importDefault(require("../base.route"));
const auth_admin_route_1 = __importDefault(require("./auth.admin.route"));
const user_route_1 = __importDefault(require("./user.route"));
const states_route_1 = __importDefault(require("./states.route"));
const subadmin_route_1 = __importDefault(require("./subadmin.route"));
const notification_route_1 = __importDefault(require("./notification.route"));
const service_route_1 = __importDefault(require("../service.route"));
const guideline_route_1 = __importDefault(require("./guideline.route"));
class AdminRoutes extends base_route_1.default {
    constructor() {
        super();
        this.authRoutes = new auth_admin_route_1.default();
        this.statsRoutes = new states_route_1.default();
        this.userRoutes = new user_route_1.default();
        this.subAdminRoutes = new subadmin_route_1.default();
        this.notificationRoutes = new notification_route_1.default();
        this.serviceRoutes = new service_route_1.default();
        this.guidelineRoutes = new guideline_route_1.default();
        this.authorize = new authorize_middleware_1.Authorize();
        this.initializeRoutes();
    }
    routes() {
        this.router.use("/auth", this.authRoutes.router);
        this.router.use((req, res, next) => this.authorize.validateAuth(req, res, next, true));
        this.router.use("/stats", this.statsRoutes.router);
        this.router.use("/user", this.userRoutes.router);
        this.router.use("/sub-admin", this.subAdminRoutes.router);
        this.router.use("/notification", this.notificationRoutes.router);
        this.router.use("/service", this.serviceRoutes.router);
        this.router.use("/guideline", this.guidelineRoutes.router);
    }
}
exports.default = AdminRoutes;
//# sourceMappingURL=admin.route.js.map