"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const enums_1 = require("../interfaces/enums");
const schemaOptions = {
    timestamps: true,
};
const notificationModel = new mongoose_1.Schema({
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    type: {
        type: Number,
        enum: enums_1.ENOTIFICATION_TYPES,
        required: true,
    },
    content: { type: String, required: true },
    title: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    data: {
        type: {
            serviceProvider: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            task: { type: mongoose_1.Schema.Types.ObjectId, ref: "Task" },
        },
        default: null,
    },
}, schemaOptions);
notificationModel.plugin(mongoose_paginate_v2_1.default);
notificationModel.plugin(mongoose_aggregate_paginate_v2_1.default);
notificationModel.index({ _id: 1, receiver: 1, sender: 1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationModel);
//# sourceMappingURL=notification.model.js.map