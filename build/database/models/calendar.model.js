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
exports.Calendar = void 0;
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
const dateValidator = (value) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) {
        throw new Error("Invalid date format. Please use YYYY-MM-DD format.");
    }
    return true;
};
const calendarModel = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        index: true,
    },
    isActive: { type: Boolean, default: true },
    task: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        default: enums_1.ECALENDARTaskType.request,
        enum: Object.values(enums_1.ECALENDARTaskType),
    },
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);
calendarModel.index({ _id: 1, date: 1 });
calendarModel.plugin(mongoose_aggregate_paginate_v2_1.default);
calendarModel.plugin(mongoose_paginate_v2_1.default);
exports.Calendar = mongoose_1.default.model("Calendar", calendarModel);
//# sourceMappingURL=calendar.model.js.map