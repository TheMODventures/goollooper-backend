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
const enums_1 = require("../database/interfaces/enums");
const paramRule = {
    id: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value) => {
        return (0, mongoose_1.isObjectIdOrHexString)(value);
    }),
};
const updateRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().notRequired(),
        amount: yup.string().notRequired(),
        type: yup
            .string()
            .oneOf([...Object.values(enums_1.Request).map((value) => value?.toString())])
            .required(),
        status: yup
            .string()
            .oneOf([
            ...Object.values(enums_1.RequestStatus).map((value) => value?.toString()),
        ])
            .notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const updateCallTokenRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        callToken: yup.string().required(),
        callDeviceType: yup.string().required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
module.exports = {
    "/request": updateRule,
    "/call/token": updateCallTokenRule,
};
//# sourceMappingURL=chat.validate.js.map