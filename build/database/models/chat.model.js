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
exports.Chat = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const enums_1 = require("../interfaces/enums");
const deleteFields = {
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
};
const chatSchema = new mongoose_1.Schema({
    groupName: {
        type: String,
        index: true,
        required: function () {
            return this.chatType === enums_1.EChatType.GROUP;
        },
    },
    ticketStatus: {
        type: String,
        enum: enums_1.ETICKET_STATUS,
    },
    isChatSupport: {
        type: Boolean,
        default: false,
    },
    isTicketClosed: {
        type: Boolean,
        default: false,
    },
    groupImageUrl: {
        type: String,
    },
    chatType: {
        type: String,
        enum: [enums_1.EChatType.ONE_TO_ONE, enums_1.EChatType.GROUP],
        default: enums_1.EChatType.ONE_TO_ONE,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return this.chatType === enums_1.EChatType.GROUP;
        },
    },
    messages: [
        {
            body: {
                type: String,
                index: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            mediaUrls: [{ type: String }],
            mediaType: {
                type: String,
            },
            sentBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: function () {
                    return this.chatType === enums_1.EChatType.ONE_TO_ONE;
                },
            },
            receivedBy: [
                {
                    user: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: "User",
                    },
                    status: {
                        type: String,
                        enum: enums_1.EMessageStatus,
                        default: enums_1.EMessageStatus.SENT,
                    },
                    createdAt: {
                        type: Date,
                        default: Date.now,
                    },
                    ...deleteFields,
                },
            ],
            type: {
                type: String,
                enum: enums_1.MessageType,
                default: enums_1.MessageType.message,
                required: true,
            },
            requestId: {
                type: mongoose_1.Schema.Types.ObjectId,
                default: null,
            },
            ...deleteFields,
        },
    ],
    lastUpdatedAt: {
        type: Date,
        default: Date.now,
    },
    participants: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            status: {
                type: String,
                default: enums_1.EParticipantStatus.ACTIVE,
            },
            isMuted: {
                type: Boolean,
                default: false,
            },
            isBlocked: {
                type: Boolean,
                default: false,
            },
        },
    ],
    task: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
    },
    requests: [
        {
            title: { type: String, default: null },
            mediaUrl: { type: String, default: null },
            amount: { type: String, default: null },
            type: {
                type: String,
                enum: enums_1.Request,
                required: true,
            },
            status: {
                type: String,
                enum: enums_1.RequestStatus,
                default: null,
            },
            createdBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    ...deleteFields,
}, {
    timestamps: true,
});
chatSchema.plugin(mongoose_paginate_v2_1.default);
chatSchema.plugin(mongoose_aggregate_paginate_v2_1.default);
exports.Chat = mongoose_1.default.model("Chat", chatSchema);
//# sourceMappingURL=chat.model.js.map