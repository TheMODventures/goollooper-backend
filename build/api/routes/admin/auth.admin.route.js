"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorize_middleware_1 = require("../../../middleware/authorize.middleware");
const validation_middleware_1 = require("../../../middleware/validation.middleware");
const base_route_1 = __importDefault(require("../base.route"));
const auth_admin_controller_1 = __importDefault(require("../../controllers/auth/auth.admin.controller"));
class AuthRoutes extends base_route_1.default {
    constructor() {
        super();
        this.authController = new auth_admin_controller_1.default();
        this.authorize = new authorize_middleware_1.Authorize();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "auth");
        this.initializeRoutes();
    }
    routes() {
        this.router.post("/login", this.validateRequest, this.authController.login);
        this.router.post("/forget-password", this.validateRequest, this.authController.forgetPassword);
        this.router.use((req, res, next) => this.authorize.validateAuth(req, res, next, true));
        this.router.post("/logout", this.validateRequest, this.authController.logout);
        this.router.post("/reset-password", this.validateRequest, this.authController.updateData);
        this.router.post("/send-otp", this.validateRequest, this.authController.resendOtp);
        this.router.post("/verify-otp", this.validateRequest, this.authController.verifyOtp);
    }
}
exports.default = AuthRoutes;
//# sourceMappingURL=auth.admin.route.js.map