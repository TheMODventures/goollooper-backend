import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

import { EUserRole, EUserLocationType } from "../interfaces/enums";
import { IUserDoc } from "../interfaces/user.interface";

const schemaOptions = {
  timestamps: true,
  strict: false,
};

const userModel: Schema = new Schema(
  {
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
    countryCode: { type: String }, // like 'PK' alpha-2 format
    phoneCode: { type: String }, // like '+92'
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
      default: EUserRole.user,
      enum: EUserRole,
    },
    volunteer: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    subscription: {
      subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
      plan: { type: Schema.Types.ObjectId, ref: "Plan" },
    },
    locationType: { type: String, enum: Object.values(EUserLocationType) },
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
  },
  schemaOptions
);

userModel.index({ _id: 1, email: 1, role: 1 });
userModel.index(
  { email: 1, phone: 1, username: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      // phone: { $type: "string" },
      // email: { $type: "string" },
      // username: { $type: "string" },
    },
  }
);
userModel.index({ selectedLocation: "2dsphere" });

userModel.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password
    const hashedPassword = await bcrypt.hash(this.password, salt);

    // Replace the plain text password with the hashed password
    this.password = hashedPassword;
    next();
  } catch (err) {
    console.log("Something went wrong whil hashing passowrd", err);
    next(err as Error);
  }
});

export const User = mongoose.model<IUserDoc>("Users", userModel);
User.ensureIndexes();
