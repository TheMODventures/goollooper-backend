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
const yup = __importStar(require("yup"));
const mongoose_1 = require("mongoose");
const enums_1 = require("../database/interfaces/enums");
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
    body: yup.object().shape({}).noUnknown(),
    query: yup
        .object()
        .shape({
        type: yup
            .string()
            .oneOf([
            ...Object.values(enums_1.TransactionType).map((value) => value?.toString()),
        ])
            .notRequired(),
        page: yup.string().required(),
        limit: yup.string().notRequired(),
    })
        .noUnknown(),
});
const createRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        user: yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value) => {
            return (0, mongoose_1.isObjectIdOrHexString)(value);
        }),
        amount: yup.number().required(),
        type: yup
            .string()
            .oneOf([
            ...Object.values(enums_1.TransactionType).map((value) => value?.toString()),
        ])
            .required(),
        task: yup.string().notRequired(),
        subscription: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().shape({}).noUnknown(),
});
const updateRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        user: yup.string().notRequired(),
        amount: yup.number().notRequired(),
        type: yup
            .string()
            .oneOf([
            ...Object.values(enums_1.TransactionType).map((value) => value?.toString()),
        ])
            .notRequired(),
        task: yup.string().notRequired(),
        subscription: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().shape({}).noUnknown(),
});
module.exports = {
    "/": indexRule,
    "/create": createRule,
    "/update": updateRule,
};
//# sourceMappingURL=transaction.validate.js.map