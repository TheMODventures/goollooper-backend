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
exports.Golist = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const enums_1 = require("../interfaces/enums");
const schemaOptions = {
    timestamps: true,
};
const golistModel = new mongoose_1.Schema({
    _id: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: Number,
        required: true,
        enum: enums_1.EList,
    },
    serviceProviders: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    ],
    taskInterests: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            // required: true,
        },
    ],
    isDeleted: { type: Boolean, default: false },
}, schemaOptions);
golistModel.index({ _id: 1, title: 1 });
golistModel.plugin(mongoose_paginate_v2_1.default);
golistModel.plugin(mongoose_aggregate_paginate_v2_1.default);
exports.Golist = mongoose_1.default.model("Golist", golistModel);
//# sourceMappingURL=golist.model.js.map