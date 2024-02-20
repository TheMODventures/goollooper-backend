"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = require("bcrypt");
const enums_1 = require("../../database/interfaces/enums");
const user_repository_1 = require("../repository/user/user.repository");
const schedule_repository_1 = require("../repository/schedule/schedule.repository");
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const token_service_1 = __importDefault(require("./token.service"));
const wallet_repository_1 = require("../repository/wallet/wallet.repository");
class AuthService {
    constructor() {
        this.myDetail = async (userId) => {
            return await this.userRepository.getById(userId);
        };
        this.validateEmail = async (email) => {
            const response = await this.userRepository.getOne({
                email: email,
                isDeleted: false,
            });
            return response ? true : false;
        };
        this.register = async (req, role) => {
            try {
                const createCode = crypto_1.default.randomInt(100000, 999999);
                const user = {
                    ...req.body,
                    role: role,
                    otpCode: Number(createCode),
                    otpExpiredAt: (0, moment_1.default)().add(60, "seconds").valueOf(),
                };
                if (req.body.fcmToken)
                    user.fcmTokens = [req.body.fcmToken];
                const data = await this.userRepository.create(user);
                const userId = new mongoose_1.default.Types.ObjectId(data._id);
                const tokenResponse = await this.tokenService.create(userId, role);
                // await this.walletRepository.create({ user: data._id } as IWallet);
                return reponseapi_helper_1.ResponseHelper.sendSignTokenResponse(201, constant_1.SUCCESS_REGISTRATION_PASSED, data, tokenResponse);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.login = async (email, password, role, fcmToken) => {
            try {
                let filter = {
                    email,
                    isDeleted: false,
                };
                if (role === enums_1.EUserRole.admin) {
                    filter = {
                        ...filter,
                        $or: [{ role: enums_1.EUserRole.admin }, { role: enums_1.EUserRole.subAdmin }],
                    };
                }
                else {
                    filter = {
                        ...filter,
                        $or: [{ role: enums_1.EUserRole.user }, { role: enums_1.EUserRole.serviceProvider }],
                    };
                }
                let response = await this.userRepository.getOne(filter, "+password", undefined, [
                    {
                        path: "volunteer",
                        model: "Service",
                        select: "title type parent",
                    },
                    {
                        path: "services",
                        model: "Service",
                        select: "title type parent",
                    },
                    {
                        path: "subscription.subscription",
                        model: "Subscription",
                    },
                ]);
                if (response === null ||
                    (response && !(await (0, bcrypt_1.compare)(password, response.password)))) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(401, constant_1.ERROR_LOGIN);
                }
                const userId = new mongoose_1.default.Types.ObjectId(response._id);
                const schedules = await this.scheduleRepository.getAll({
                    user: userId,
                    isActive: true,
                });
                const res = { ...response, schedule: schedules };
                const tokenResponse = await this.tokenService.create(userId, response.role);
                if (fcmToken)
                    this.userRepository.updateById(response._id?.toString() ?? "", {
                        $addToSet: { fcmTokens: fcmToken },
                    });
                return reponseapi_helper_1.ResponseHelper.sendSignTokenResponse(200, constant_1.SUCCESS_LOGIN_PASSED, res, tokenResponse);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.forgotPassword = async (email) => {
            try {
                const responseData = await this.userRepository.getOne({
                    email: email,
                });
                if (responseData === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                const response = await this.resendOtp(email);
                const userId = new mongoose_1.default.Types.ObjectId(responseData._id);
                const tokenResponse = await this.tokenService.create(userId, responseData.role);
                return reponseapi_helper_1.ResponseHelper.sendSignTokenResponse(200, constant_1.SUCCESS_OTP_SEND_PASSED, response.data, tokenResponse);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.getAccessToken = async (refreshToken) => {
            try {
                const response = await this.tokenService.validateToken(undefined, undefined, refreshToken);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                const resp = await this.tokenService.setNewToken(response._id, response.userId, response.role, refreshToken);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_NEW_TOKEN_PASSED, resp);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.verifyOtp = async (userId, code) => {
            try {
                const response = await this.userRepository.getOne({
                    _id: userId,
                    otpCode: code,
                    otpExpiredAt: { $gte: (0, moment_1.default)().valueOf() },
                });
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404, constant_1.ERROR_VERiFICATION);
                }
                await this.userRepository.updateById(userId, {
                    otpCode: null,
                    otpExpiredAt: null,
                    isVerified: true,
                });
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_OTP_VERIFICATION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.resendOtp = async (email) => {
            try {
                const createCode = crypto_1.default.randomInt(100000, 999999);
                const updateObj = {
                    otpCode: Number(createCode),
                    otpExpiredAt: (0, moment_1.default)().add(60, "seconds").valueOf(),
                };
                const response = await this.userRepository.updateByOne({
                    email,
                }, updateObj);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_OTP_SEND_PASSED, updateObj);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.logout = async (userId, refreshToken, fcmToken) => {
            try {
                await this.tokenService.loggedOut(userId, refreshToken, fcmToken);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_LOGOUT_PASS);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.updateData = async (userId, req, oldPassword) => {
            let path = undefined;
            try {
                const response = await this.userRepository.getOne({
                    _id: userId,
                }, "+password");
                if (oldPassword) {
                    if (response === null ||
                        (response && !(await (0, bcrypt_1.compare)(oldPassword, response.password)))) {
                        return reponseapi_helper_1.ResponseHelper.sendResponse(404, constant_1.ERROR_OLD_PASSWORD);
                    }
                }
                const data = { ...req.body };
                const resp = await this.userRepository.updateById(userId, data);
                if (resp === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, resp);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.userRepository = new user_repository_1.UserRepository();
        this.tokenService = new token_service_1.default();
        this.scheduleRepository = new schedule_repository_1.ScheduleRepository();
        this.walletRepository = new wallet_repository_1.WalletRepository();
    }
}
exports.default = AuthService;
//# sourceMappingURL=auth.service.js.map