import { Moment } from "moment";
import mongoose, { Document } from "mongoose";

import {
  Days,
  EUserLocationType,
  EUserRole,
  Repetition,
  RepetitionEvery,
} from "./enums";

interface Location {
  type: string;
  coordinates: [number, number];
  state?: string;
  city?: string;
  county?: string;
  isSelected: boolean;
  readableLocation?: string;
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

interface Schedule {
  startDate: string;
  endDate: string;
  slots: [
    {
      startTime: string;
      endTime: string;
    }
  ];
  repetition: Repetition;
  repeatsAfter: string;
  repeatsEvery: RepetitionEvery;
  repeatsOn: Days;
  occurrence: string;
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
  galleryImages: string[];
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
  selectedLocation?: Location;
  zipCode?: ZipCode[];
  visuals?: string[];
  visualFiles?: string[];
  company?: {
    name?: string;
    logo?: string;
    website?: string;
    affiliation?: string;
    publication?: string;
    resume?: string;
  };
  certificates?: string[];
  certificateFiles?: string[];
  licenses?: string[];
  licenseFiles?: string[];
  reference?: {
    name: string;
    contact: string;
  };
  insurances?: string[];
  insuranceFiles?: string[];
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

export interface IUserWithSchedule extends IUser {
  schedule?: Schedule;
}

export interface IUserDoc extends IUser, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
