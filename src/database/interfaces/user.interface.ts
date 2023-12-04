import { Moment } from "moment";
import mongoose, { Document } from "mongoose";

import { EUserLocationType, EUserRole } from "./enums";

interface Location {
  type: string;
  coordinates: [number, number];
  state?: string;
  city?: string;
  county?: string;
  isSelected: boolean;
}

interface Volunteer {
  service: string;
  subService: string;
}

interface Service {
  service: string;
  subService: string;
}

interface ZipCode {
  code: string;
  isSelected: boolean;
}

export interface IUser {
  _id?: string | mongoose.Types.ObjectId;
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
  completePhone?: string;
  profileImage?: string;
  gallery?: string[];
  about?: string;
  role: EUserRole;
  volunteer?: Volunteer[];
  services?: Service[];
  subscription?: {
    subscription: string;
    plan: string;
  };
  locationType?: EUserLocationType;
  location?: Location[];
  zipCode?: ZipCode[];
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
