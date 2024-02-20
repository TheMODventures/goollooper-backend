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
const user_service_1 = __importDefault(require("../api/services/user.service"));
const enums_1 = require("../database/interfaces/enums");
const userService = new user_service_1.default();
const paramRule = {
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
        phoneContacts: yup.array().when(["type"], {
            is: (type) => type == enums_1.EList.myList,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.nullable(),
        }),
        serviceProviders: yup
            .array()
            .min(1)
            .when(["type"], {
            is: (type) => type == enums_1.EList.goList,
            then: (schema) => schema.required(),
            otherwise: (schema) => schema.nullable(),
        })
            .of(paramRule.id.test("not exist", "user not exist", async (value) => {
            return (await userService.show(value)).status;
        }))
            .test("is-unique", "serviceProviders id must be unique", function (value) {
            if (!value)
                return true; // If the array is empty, consider it valid
            return new Set(value).size === value.length;
        }),
        type: yup
            .number()
            .oneOf([...Object.values(enums_1.EList).map((value) => Number(value))])
            .required(),
        taskInterests: yup.array().of(paramRule.id).notRequired(),
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
        name: yup.string().notRequired(),
        title: yup.string().notRequired(),
        type: yup
            .string()
            .oneOf([...Object.values(enums_1.EList).map((value) => value.toString())])
            .notRequired(),
    })
        .noUnknown(),
});
const showRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup
        .object({ latitude: yup.string(), longitude: yup.string() })
        .noUnknown(),
});
const updateRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().notRequired(),
        serviceProviders: yup
            .array()
            .of(paramRule.id.test("not exist", "user not exist", async (value) => {
            return (await userService.show(value)).status;
        }))
            .test("is-unique", "serviceProviders id must be unique", function (value) {
            if (!value)
                return true; // If the array is empty, consider it valid
            return new Set(value).size === value.length;
        })
            .required(),
        taskInterests: yup.array().of(paramRule.id).notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const shareRule = yup.object().shape({
    params: yup.object().shape({}).noUnknown(),
    body: yup
        .object()
        .shape({
        serviceProviderId: paramRule.id,
        myList: yup
            .array()
            .of(paramRule.id.test("not exist", "user not exist", async (value) => {
            return (await userService.show(value)).status;
        }))
            .required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const checkPostalCodeRule = yup.object().shape({
    params: yup.object().shape({}).noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup.object().shape({
        zipCode: yup.string().required(),
    }),
});
const getNearestServiceProvidersRule = yup.object().shape({
    params: yup.object().shape({}).noUnknown(),
    body: yup
        .object()
        .shape({
        zipCode: yup.string(),
        latitude: yup.string(),
        longitude: yup.string(),
        rating: yup
            .string()
            .oneOf([...Object.values(enums_1.ERating).map((value) => value.toString())]),
        taskInterests: yup.array().of(paramRule.id).notRequired(),
        volunteers: yup.array().of(paramRule.id).notRequired(),
        subscription: yup.string().notRequired(),
        companyLogo: yup.boolean().notRequired(),
        companyRegistration: yup.boolean().notRequired(),
        companyWebsite: yup.boolean().notRequired(),
        companyAffilation: yup.boolean().notRequired(),
        companyPublication: yup.boolean().notRequired(),
        companyResume: yup.boolean().notRequired(),
        certificate: yup.boolean().notRequired(),
        license: yup.boolean().notRequired(),
        reference: yup.boolean().notRequired(),
        insurance: yup.boolean().notRequired(),
        visualPhotos: yup.boolean().notRequired(),
        visualVideos: yup.boolean().notRequired(),
        search: yup.string(),
    })
        .test("zipCodeOrCoordinates", "Either zipCode or both latitude and longitude are required", function (value) {
        const { zipCode, latitude, longitude } = value;
        if (zipCode && (latitude || longitude)) {
            return this.createError({
                message: "Either zipCode or both latitude and longitude are required",
                path: "zipCode",
            });
        }
        return true;
    })
        .noUnknown(),
    query: yup
        .object()
        .shape({
        page: yup.string().required(),
        limit: yup.string().notRequired(),
    })
        .noUnknown(),
});
module.exports = {
    "/": indexRule,
    "/create": createRule,
    "/update": updateRule,
    "/show": showRule,
    "/delete": showRule,
    "/zip-code": checkPostalCodeRule,
    "/nearest-service-provider": getNearestServiceProvidersRule,
    "/share": shareRule,
};
//# sourceMappingURL=golist.validate.js.map