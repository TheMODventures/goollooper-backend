import { Moment } from "moment";
import mongoose, { Document } from "mongoose";

import { EUserLocationType, EUserRole } from "./enums";

export interface IUser {
  _id?: string | mongoose.Types.ObjectId;
  role: EUserRole;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password?: string;
  gender?: string;
  age?: number;
  countryCode?: string;
  phoneCode?: string;
  phone?: string;
  profileImage?: string;
  gallery?: string[];
  about?: string;
  locationType?: EUserLocationType;
  location?: { type: string; coordinates: [number, number] } | null;
  state?: string;
  city?: string;
  country?: string;
  zipCode?: {
    code: String;
    isSelected: Boolean;
  }[];
  visuals?: string[];
  company?: {
    name?: String;
    logo?: String;
    website?: String;
    affiliation?: String;
    publication?: String;
    resume?: String;
  };
  certificates?: string[];
  licenses?: string[];
  reference?: {
    name: String;
    contact: String;
  };
  insurances?: string[];
  isProfileCompleted?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  fcmToken?: string;
  refreshToken?: string;
  otpCode?: number | null;
  otpExpiredAt?: number | null;
  isDeleted?: boolean;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
  deletedAt?: Date | Moment | null;
}

export interface IUserDoc extends IUser, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
