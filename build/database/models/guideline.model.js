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
exports.Guideline = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../interfaces/enums");
const schemaOptions = {
    timestamps: true,
    versionKey: false,
};
const guidelineModel = new mongoose_1.Schema({
    type: { type: Number, enum: enums_1.EGUIDELINE, required: true },
    title: { type: String },
    content: { type: String, required: true },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, schemaOptions);
guidelineModel.index({ _id: 1, name: 1, isPublish: 1 });
exports.Guideline = mongoose_1.default.model("Guideline", guidelineModel);
//# sourceMappingURL=guideline.model.js.map