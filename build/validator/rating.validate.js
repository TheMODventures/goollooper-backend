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
const mongoose_1 = require("mongoose");
const yup = __importStar(require("yup"));
const indexRule = yup.object().shape({
    params: yup
        .object()
        .shape({
        user: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
    })
        .noUnknown(),
});
const createRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        to: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
        by: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
        task: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
        star: yup.number().min(1).max(5).required(),
        description: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const createMultipleRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        to: yup
            .array()
            .of(yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }))
            .min(1)
            .required(),
        by: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
        task: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
        star: yup.number().min(1).max(5).required(),
        description: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
module.exports = {
    "/": indexRule,
    "/create": createRule,
    "/multiple": createMultipleRule,
};
//# sourceMappingURL=rating.validate.js.map