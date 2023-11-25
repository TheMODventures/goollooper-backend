import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

import { EUserRole } from "../interfaces/enums";
import { IUserDoc } from "../interfaces/user.interface";

const schemaOptions = {
  timestamps: true,
  strict: false,
};

const userModel: Schema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },
    role: {
      type: Number,
      required: true,
      enum: EUserRole,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      select: false, // exclude from query result
    },
    otpCode: {
      type: Number,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
  },
  schemaOptions
);

userModel.index({ _id: 1, email: 1, role: 1 });

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
