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
const paramRule = {
    id: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value) => {
        return (0, mongoose_1.isObjectIdOrHexString)(value);
    }),
};
const subServiceParamRule = {
    serviceId: yup
        .string()
        .required()
        .test("invalid serviceId", "No Such Id Exist", (value) => {
        return (0, mongoose_1.isObjectIdOrHexString)(value);
    }),
};
const subServiceUpdateParamRule = {
    serviceId: yup
        .string()
        .required()
        .test("invalid serviceId", "No Such serviceId Exist", (value) => {
        return (0, mongoose_1.isObjectIdOrHexString)(value);
    }),
    id: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value) => {
        return (0, mongoose_1.isObjectIdOrHexString)(value);
    }),
};
const createRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().required(),
        type: yup.string().required(),
        parent: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const indexRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup
        .object()
        .shape({
        page: yup.string().required(),
        limit: yup.string().notRequired(),
        title: yup.string().notRequired(),
        type: yup.string().notRequired(),
    })
        .noUnknown(),
});
const showRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup.object().noUnknown(),
});
const updateRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().notRequired(),
        type: yup.string().notRequired(),
        parent: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
// sub-services
const createSubServiceRule = yup.object().shape({
    params: yup.object(subServiceParamRule).noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const updateSubServiceRule = yup.object().shape({
    params: yup.object().shape(subServiceUpdateParamRule).noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const deleteSubServiceRule = yup.object().shape({
    params: yup.object().shape(subServiceUpdateParamRule).noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup.object().noUnknown(),
});
module.exports = {
    "/": indexRule,
    "/create": createRule,
    "/update": updateRule,
    "/show": showRule,
    "/delete": showRule,
    "/sub-service/create": createSubServiceRule,
    "/sub-service/update": updateSubServiceRule,
    "/sub-service/delete": deleteSubServiceRule,
};
//# sourceMappingURL=service.validate.js.map