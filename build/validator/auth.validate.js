"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mongoose_1 = require("mongoose");
const phone_1 = __importDefault(require("phone"));
const yup = __importStar(require("yup"));
const jwt = __importStar(require("jsonwebtoken"));
const environment_config_1 = require("../config/environment.config");
const enums_1 = require("../database/interfaces/enums");
const auth_service_1 = __importDefault(require("../api/services/auth.service"));
const authData = new auth_service_1.default();
const registerRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        email: yup
            .string()
            .email()
            .required()
            .test("email_unique", "Email Already Exists", async (value) => {
            if (!value) {
                return true;
            }
            return !(await authData.validateEmail(value));
        }),
        password: yup.string().required().min(6),
        fcmToken: yup.string().nullable(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const getAccessTokenRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        refreshToken: yup
            .string()
            .required()
            .test("inavlid_token", "No Such Refresh Token Exsit!", (value) => {
            if (!value) {
                return true;
            }
            return jwt.verify(value, environment_config_1.JWT_REFRESH_SECRET_KEY, function (err, decoded) {
                if (err || typeof decoded == "string") {
                    return false;
                }
                return true;
            });
        }),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const loginRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        email: yup.string().email().required(),
        password: yup.string().min(3).required(),
        fcmToken: yup.string().nullable(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const logoutRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        refreshToken: yup
            .string()
            .required()
            .test("inavlid_token", "No Such Refresh Token Exsit!", (value) => {
            if (!value) {
                return true;
            }
            return jwt.verify(value, environment_config_1.JWT_REFRESH_SECRET_KEY, function (err, decoded) {
                if (err || typeof decoded == "string") {
                    return false;
                }
                return true;
            });
        }),
        fcmToken: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const updateData = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        role: yup
            .number()
            .oneOf([...Object.values(enums_1.EUserRole).map((value) => Number(value))])
            .notRequired(),
        email: yup.string().when("role", (st, schema) => {
            return st && st[0] === Number(enums_1.EUserRole.admin)
                ? yup.string().email().required()
                : yup.string().notRequired().strip();
        }),
        firstName: yup.string().required(),
        lastName: yup.string().required(),
        emailAlert: yup.bool().notRequired().nullable(),
        inAppNotification: yup.bool().notRequired().nullable(),
        package: yup.lazy((value) => {
            if (!value) {
                return yup.string().notRequired().strip();
            }
            return yup
                .string()
                .required()
                .test("is-object-id", "Invalid Package Id", (value) => {
                return (0, mongoose_1.isObjectIdOrHexString)(value);
            });
        }),
        risk: yup
            .object()
            .shape({
            description: yup.string().required(),
            score: yup.number().required(),
            total: yup.number().required(),
        })
            .notRequired()
            .noUnknown(),
        phoneNumber: yup
            .string()
            .nullable()
            .notRequired()
            .test("invalid_number", "No such Phone Number exists!", (value) => {
            if (typeof value !== "string") {
                return true;
            }
            return (0, phone_1.default)(value, { validateMobilePrefix: true }).isValid;
        }),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const resetPassword = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        password: yup.string().min(6).required(),
        confirmPassword: yup
            .string()
            .oneOf([yup.ref("password")], "Passwords must match")
            .required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const updatePassword = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        oldPassword: yup.string().min(6).required(),
        password: yup.string().min(6).required(),
        confirmPassword: yup
            .string()
            .oneOf([yup.ref("password")], "Passwords must match")
            .required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const forgetPassword = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        email: yup
            .string()
            .email()
            .required()
            .test("email_unique", "Email Doesn't Exists", async (value) => {
            if (!value) {
                return true;
            }
            return !!(await authData.validateEmail(value));
        }),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const resendOtp = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        email: yup.string().email().required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const verifyOtp = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        code: yup
            .number()
            .required()
            .test("len", "OTP code must be exactly 6 digits", (val) => {
            if (!val) {
                return true;
            }
            return val.toString().length === 6;
        }),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
module.exports = {
    "/register": registerRule,
    "/login": loginRule,
    "/logout": logoutRule,
    "/forget-password": forgetPassword,
    "/reset-password": resetPassword,
    "/get-new-token": getAccessTokenRule,
    "/send-otp": resendOtp,
    "/verify-otp": verifyOtp,
    "/update": updateData,
    "/update-detail": updateData,
    "/update-password": updatePassword,
};
//# sourceMappingURL=auth.validate.js.map