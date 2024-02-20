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
const yup = __importStar(require("yup"));
const enums_1 = require("../database/interfaces/enums");
const auth_service_1 = __importDefault(require("../api/services/auth.service"));
const authData = new auth_service_1.default();
const paramRule = {
    id: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value) => {
        return (0, mongoose_1.isObjectIdOrHexString)(value);
    }),
};
const indexRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup.object().noUnknown(),
    query: yup
        .object()
        .shape({
        page: yup.string().required(),
        limit: yup.string().notRequired(),
        username: yup.string().notRequired(),
        email: yup.string().notRequired(),
    })
        .noUnknown(),
});
const showRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup.object().noUnknown(),
});
const createRule = yup.object().shape({
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
        firstName: yup.string().notRequired(),
        lastName: yup.string().notRequired(),
        username: yup.string().min(3).max(20).notRequired(),
        gender: yup.string().notRequired(),
        age: yup.string().notRequired(),
        countryCode: yup.string().notRequired(),
        phoneCode: yup.string().notRequired(),
        phone: yup.string().notRequired(),
        locationType: yup
            .string()
            .oneOf([...Object.values(enums_1.EUserLocationType).map((value) => value)])
            .default(enums_1.EUserLocationType.global),
        location: yup
            .array()
            .of(yup.object().shape({
            type: yup.string().oneOf(["Point"]).default("Point"),
            coordinates: yup.array().of(yup.string()).length(2),
            state: yup.string().notRequired(),
            city: yup.string().notRequired(),
            county: yup.string().notRequired(),
            isSelected: yup.string(),
            readableLocation: yup.string(),
        }))
            .notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const updateRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        firstName: yup.string().notRequired(),
        lastName: yup.string().notRequired(),
        username: yup.string().min(3).max(20).notRequired(),
        gender: yup.string().notRequired(),
        age: yup.string().notRequired(),
        countryCode: yup.string().notRequired(),
        phoneCode: yup.string().notRequired(),
        phone: yup.string().notRequired(),
        locationType: yup
            .string()
            .oneOf([...Object.values(enums_1.EUserLocationType).map((value) => value)])
            .default(enums_1.EUserLocationType.global),
        location: yup
            .array()
            .of(yup.object().shape({
            type: yup.string().oneOf(["Point"]).default("Point"),
            coordinates: yup.array().of(yup.string()).length(2),
            state: yup.string().notRequired(),
            city: yup.string().notRequired(),
            county: yup.string().notRequired(),
            isSelected: yup.string(),
            readableLocation: yup.string(),
        }))
            .notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
module.exports = {
    "/": indexRule,
    "/show": showRule,
    "/create": createRule,
    "/update": updateRule,
    "/delete": showRule,
};
//# sourceMappingURL=subadmin.validate.js.map