"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_service_1 = __importDefault(require("../../services/auth.service"));
class AuthBaseController {
    constructor() {
        this.getAccessToken = async (req, res) => {
            const { refreshToken } = req.body;
            const response = await this.authService.getAccessToken(refreshToken);
            return res.status(response.code).json(response);
        };
        this.logout = async (req, res) => {
            const userId = req?.locals?.auth?.userId;
            const { refreshToken, fcmToken } = req.body;
            const response = await this.authService.logout(userId, refreshToken, fcmToken);
            return res.status(response.code).json(response);
        };
        this.updateData = async (req, res) => {
            const userId = req?.locals?.auth?.userId;
            let oldPassword = undefined;
            if (req.body.confirmPassword) {
                const salt = await bcrypt_1.default.genSalt(10);
                const hashedPassword = await bcrypt_1.default.hash(req.body.password, salt);
                req.body.password = hashedPassword;
                delete req.body.confirmPassword;
            }
            if (req.body.oldPassword) {
                oldPassword = req.body.oldPassword;
                delete req.body.oldPassword;
            }
            if (req.body.role) {
                delete req.body.role;
            }
            if (req.body.isBanned) {
                delete req.body.isBanned;
            }
            const response = await this.authService.updateData(userId, req, oldPassword);
            return res.status(response.code).json(response);
        };
        this.authService = new auth_service_1.default();
    }
}
exports.default = AuthBaseController;
//# sourceMappingURL=auth.base.controller.js.map