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
const showRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup.object().noUnknown(),
});
const indexRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        taskInterests: yup.array().of(paramRule.id).notRequired(),
    })
        .noUnknown(),
    query: yup
        .object()
        .shape({
        page: yup.string().required(),
        limit: yup.string().notRequired(),
        title: yup.string().notRequired(),
    })
        .noUnknown(),
});
const myTaskRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup.object().shape({}).noUnknown(),
    query: yup
        .object()
        .shape({
        page: yup.string().required(),
        limit: yup.string().notRequired(),
        type: yup.string().oneOf(["accepted", "created"]).notRequired(),
    })
        .noUnknown(),
});
const createRule = yup.object().shape({
    params: yup.object().noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().required(),
        description: yup.string().notRequired(),
        location: yup
            .object()
            .shape({
            coordinates: yup.array().of(yup.string()).length(2).required(),
            readableLocation: yup.string().required(),
        })
            .required(),
        requirement: yup.string().notRequired(),
        date: yup
            .string()
            .matches(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Please enter a valid start date in the format YYYY-MM-DD")
            .required(),
        slot: yup
            .object()
            .shape({
            startTime: yup
                .string()
                .required()
                .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time format. Please use HH:mm format."),
            endTime: yup
                .string()
                .required()
                .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time format. Please use HH:mm format."),
        })
            .required(),
        noOfServiceProvider: yup.string().notRequired(),
        commercial: yup.boolean().notRequired(),
        type: yup
            .string()
            .oneOf([...Object.values(enums_1.TaskType).map((value) => value?.toString())])
            .default(enums_1.TaskType.normal)
            .notRequired(),
        taskInterests: yup.array().of(yup.string().length(24)).default([]),
        goList: yup.string().length(24).notRequired(),
        goListServiceProviders: yup
            .array()
            .of(yup.string().length(24))
            .notRequired(),
        myList: yup.array().of(yup.string().length(24)).default([]),
        subTasks: yup
            .array()
            .of(yup.object().shape({
            title: yup.string().required(),
            noOfServiceProvider: yup.string().notRequired(),
            note: yup.string().notRequired(),
            slot: yup
                .object()
                .shape({
                startTime: yup
                    .string()
                    .notRequired()
                    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time format. Please use HH:mm format."),
                endTime: yup
                    .string()
                    .notRequired()
                    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time format. Please use HH:mm format."),
            })
                .notRequired(),
        }))
            .default([]),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const updateRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        title: yup.string().notRequired(),
        description: yup.string().notRequired(),
        location: yup
            .object()
            .shape({
            coordinates: yup.array().of(yup.string()).length(2),
            readableLocation: yup.string(),
        })
            .notRequired(),
        requirement: yup.string().notRequired(),
        date: yup
            .string()
            .matches(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Please enter a valid start date in the format YYYY-MM-DD")
            .notRequired(),
        slot: yup
            .object()
            .shape({
            startTime: yup
                .string()
                .required()
                .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time format. Please use HH:mm format."),
            endTime: yup
                .string()
                .required()
                .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time format. Please use HH:mm format."),
        })
            .notRequired(),
        noOfServiceProvider: yup.string().notRequired(),
        commercial: yup.boolean().notRequired(),
        type: yup
            .string()
            .oneOf([...Object.values(enums_1.TaskType).map((value) => value?.toString())])
            .notRequired(),
        taskInterests: yup.array().of(yup.string().length(24)).default([]),
        goList: yup.string().length(24).notRequired(),
        goListServiceProviders: yup
            .array()
            .of(yup.string().length(24))
            .notRequired(),
        myList: yup.array().of(yup.string().length(24)).default([]),
        subTasks: yup
            .array()
            .of(yup.object().shape({
            title: yup.string().required(),
            noOfServiceProvider: yup.string().notRequired(),
            note: yup.string().notRequired(),
            slot: yup
                .object()
                .shape({
                startTime: yup
                    .string()
                    .required()
                    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time format. Please use HH:mm format."),
                endTime: yup
                    .string()
                    .required()
                    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time format. Please use HH:mm format."),
            })
                .notRequired(),
        }))
            .default([])
            .notRequired(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
const toggleRequestRule = yup.object().shape({
    params: yup.object().shape(paramRule).noUnknown(),
    body: yup
        .object()
        .shape({
        user: paramRule.id,
        status: yup
            .number()
            .oneOf([
            enums_1.ETaskUserStatus.ACCEPTED,
            enums_1.ETaskUserStatus.REJECTED,
            enums_1.ETaskUserStatus.STANDBY,
        ])
            .required(),
        type: yup.string().oneOf(["goList", "user"]).required(),
    })
        .noUnknown(),
    query: yup.object().noUnknown(),
});
module.exports = {
    "/": indexRule,
    "/my-task": myTaskRule,
    "/show": showRule,
    "/create": createRule,
    "/update": updateRule,
    "/delete": showRule,
    "/toggle-request": toggleRequestRule,
    "/request": showRule,
};
//# sourceMappingURL=task.validate.js.map