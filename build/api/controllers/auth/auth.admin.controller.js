"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../../../database/interfaces/enums");
const auth_base_controller_1 = __importDefault(require("./auth.base.controller"));
class AuthController extends auth_base_controller_1.default {
    constructor() {
        super(...arguments);
        this.login = async (req, res) => {
            const { email, password } = req.body;
            const response = await this.authService.login(email, password, enums_1.EUserRole.admin);
            return res.status(response.code).json(response);
        };
        this.forgetPassword = async (req, res) => {
            const { email } = req.body;
            const response = await this.authService.forgotPassword(email);
            return res.status(response.code).json(response);
        };
        this.resendOtp = async (req, res) => {
            const { email } = req.body;
            const response = await this.authService.resendOtp(email);
            return res.status(response.code).json(response);
        };
        this.verifyOtp = async (req, res) => {
            const userId = req?.locals?.auth?.userId;
            const { code } = req.body;
            const response = await this.authService.verifyOtp(userId, code);
            return res.status(response.code).json(response);
        };
    }
}
exports.default = AuthController;
//# sourceMappingURL=auth.admin.controller.js.map