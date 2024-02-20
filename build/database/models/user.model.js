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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const enums_1 = require("../interfaces/enums");
const schemaOptions = {
    timestamps: true,
    strict: false,
};
const userModel = new mongoose_1.Schema({
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    username: {
        type: String,
        trim: true,
        default: null,
        index: {
            unique: true,
            partialFilterExpression: {
                username: { $type: "string" },
                isDeleted: false,
            },
        },
    },
    email: {
        type: String,
        // unique: true,
        index: {
            unique: true,
            partialFilterExpression: {
                email: { $type: "string" },
                isDeleted: false,
            },
        },
        required: true,
        lowercase: true,
        trim: true,
    },
    password: { type: String, required: true, select: false },
    gender: { type: String },
    age: { type: Number, default: null },
    countryCode: { type: String },
    phoneCode: { type: String },
    phone: {
        type: String,
        default: null,
        trime: true,
        index: {
            unique: true,
            partialFilterExpression: {
                phone: { $type: "string" },
                isDeleted: false,
            },
        },
    },
    completePhone: { type: String, select: false },
    profileImage: { type: String },
    gallery: [String],
    about: { type: String, default: null },
    role: {
        type: Number,
        default: enums_1.EUserRole.user,
        enum: enums_1.EUserRole,
    },
    volunteer: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Service" }],
    services: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Service" }],
    subscription: {
        subscription: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subscription" },
        plan: { type: mongoose_1.Schema.Types.ObjectId, ref: "Plan" },
    },
    locationType: { type: String, enum: Object.values(enums_1.EUserLocationType) },
    location: [
        {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number, Number] },
            state: { type: String, default: null },
            city: { type: String, default: null },
            county: { type: String, default: null },
            isSelected: { type: Boolean, default: false },
            readableLocation: { type: String, default: null },
        },
    ],
    selectedLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number, Number], default: [0, 0] },
        state: { type: String, default: null },
        zipCode: { type: String, default: null },
        city: { type: String, default: null },
        county: { type: String, default: null },
        readableLocation: { type: String, default: null },
    },
    zipCode: [
        {
            code: { type: String, default: null },
            isSelected: { type: Boolean, default: false },
        },
    ],
    visuals: [String],
    company: {
        name: { type: String, default: null },
        logo: { type: String, default: null },
        website: { type: String, default: null },
        affiliation: { type: String, default: null },
        publication: { type: String, default: null },
        resume: { type: String, default: null },
    },
    certificates: [String],
    licenses: [String],
    reference: {
        name: { type: String, default: null },
        contact: { type: String, default: null },
    },
    insurances: [String],
    isProfileCompleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    fcmTokens: [{ type: String }],
    refreshToken: { type: String, select: false },
    otpCode: {
        type: Number,
        select: false,
    },
    otpExpiredAt: {
        type: Number,
        select: false, // exclude from query result
    },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isContactPermission: { type: Boolean, default: true },
    callToken: { type: String, default: null },
    callDeviceType: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },
    stripeConnectId: { type: String, default: null },
    wallet: { type: mongoose_1.Schema.Types.ObjectId, ref: "Wallet", default: null },
}, schemaOptions);
userModel.index({ _id: 1, email: 1, role: 1 });
userModel.index({ email: 1, phone: 1, username: 1 }, {
    unique: true,
    partialFilterExpression: {
        isDeleted: false,
        // phone: { $type: "string" },
        // email: { $type: "string" },
        // username: { $type: "string" },
    },
});
userModel.index({ selectedLocation: "2dsphere" });
userModel.plugin(mongoose_paginate_v2_1.default);
userModel.plugin(mongoose_aggregate_paginate_v2_1.default);
userModel.pre("save", async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
        return next();
    }
    try {
        // Generate a salt
        const salt = await bcrypt_1.default.genSalt(10);
        // Hash the password
        const hashedPassword = await bcrypt_1.default.hash(this.password, salt);
        // Replace the plain text password with the hashed password
        this.password = hashedPassword;
        next();
    }
    catch (err) {
        console.log("Something went wrong whil hashing passowrd", err);
        next(err);
    }
});
exports.User = mongoose_1.default.model("Users", userModel);
exports.User.ensureIndexes();
//# sourceMappingURL=user.model.js.map