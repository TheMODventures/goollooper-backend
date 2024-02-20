"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_user_controller_1 = __importDefault(require("../controllers/auth/auth.user.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class AuthRoutes extends base_route_1.default {
    constructor() {
        super();
        this.authController = new auth_user_controller_1.default();
        this.authorize = new authorize_middleware_1.Authorize();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "auth");
        this.initializeRoutes();
    }
    routes() {
        this.router.post("/register", this.validateRequest, this.authController.register);
        this.router.post("/login", this.validateRequest, this.authController.login);
        this.router.post("/forget-password", this.validateRequest, this.authController.forgetPassword);
        this.router.post("/get-new-token", this.validateRequest, this.authController.getAccessToken);
        this.router.use(this.authorize.validateAuth);
        this.router.post("/reset-password", this.validateRequest, this.authController.updateData);
        this.router.post("/send-otp", this.validateRequest, this.authController.resendOtp);
        this.router.post("/verify-otp", this.validateRequest, this.authController.verifyOtp);
        this.router.post("/logout", this.validateRequest, this.authController.logout);
    }
}
exports.default = AuthRoutes;
//# sourceMappingURL=auth.user.route.js.map