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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
const mongoose_1 = __importStar(require("mongoose"));
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
const scheduleModel = new mongoose_1.Schema({
    date: Date,
    day: { type: String, enum: Object.values(enums_1.Days) },
    slots: [
        {
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
    ],
    isActive: { type: Boolean, default: true },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, schemaOptions);
scheduleModel.index({ _id: 1, name: 1, isPublish: 1 });
exports.Schedule = mongoose_1.default.model("Schedules", scheduleModel);
//# sourceMappingURL=schedule.model.js.map