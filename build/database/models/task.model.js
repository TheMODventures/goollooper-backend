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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const enums_1 = require("../interfaces/enums");
const schemaOptions = {
    timestamps: true,
};
const timeValidator = (value) => {
    const regex = /^([01]\d|2[0-3]):[0-5]\d$/; // Regular expression for HH:mm format
    if (!regex.test(value)) {
        throw new Error("Invalid time format. Please use HH:mm format.");
    }
    return true;
};
const taskModel = new mongoose_1.Schema({
    title: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        default: null,
    },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number, Number] },
        readableLocation: String,
    },
    requirement: { type: String, default: null },
    date: { type: Date, required: true },
    slot: {
        startTime: {
            type: String,
            required: true,
            validate: [timeValidator, "Invalid start time"],
        },
        endTime: {
            type: String,
            required: true,
            validate: [timeValidator, "Invalid end time"],
        },
    },
    noOfServiceProvider: { type: Number },
    media: { type: String },
    commercial: { type: Boolean, default: false },
    type: {
        type: String,
        required: true,
        enum: enums_1.TaskType,
        default: enums_1.TaskType.normal,
    },
    taskInterests: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Service",
            default: [],
        },
    ],
    goList: {
        title: {
            type: String,
        },
        serviceProviders: {
            type: [
                {
                    user: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        required: true,
                        ref: "Users",
                    },
                    status: {
                        type: Number,
                        // enum: Object.values(ETaskUserStatus),
                        default: enums_1.ETaskUserStatus.STANDBY,
                    },
                },
            ],
        },
        taskInterests: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Service",
            },
        ],
        goListId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Golist",
        },
    },
    subTasks: [
        {
            title: { type: String },
            noOfServiceProvider: { type: Number },
            note: {
                type: String,
                default: null,
            },
            slot: {
                startTime: {
                    type: String,
                    required: false,
                    validate: [timeValidator, "Invalid start time"],
                },
                endTime: {
                    type: String,
                    required: false,
                    validate: [timeValidator, "Invalid end time"],
                },
            },
            media: { type: String },
        },
    ],
    postedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    gender: { type: String, default: null },
    ageFrom: { type: Number, default: null },
    ageTo: { type: Number, default: null },
    endDate: { type: Date, required: false },
    users: {
        type: [
            {
                _id: false,
                user: {
                    type: mongoose_1.default.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                status: {
                    type: Number,
                    enum: Object.values(enums_1.ETaskUserStatus),
                    default: enums_1.ETaskUserStatus.PENDING,
                },
            },
        ],
        default: [],
    },
    pendingCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: Object.values(enums_1.ETaskStatus),
        default: enums_1.ETaskStatus.pending,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, schemaOptions);
taskModel.index({ _id: 1, title: 1 });
taskModel.plugin(mongoose_paginate_v2_1.default);
taskModel.plugin(mongoose_aggregate_paginate_v2_1.default);
exports.Task = mongoose_1.default.model("Task", taskModel);
//# sourceMappingURL=task.model.js.map