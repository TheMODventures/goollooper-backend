import { Moment } from "moment";
import mongoose, { Document } from "mongoose";

import { Days, EUserLocationType, EUserRole } from "./enums";
import { IService } from "./service.interface";

interface Location {
  type: string;
  coordinates?: [number, number];
  state?: string;
  zipCode?: string;
  city?: string;
  town?: string;
  county?: string;
  isSelected: string;
  readableLocation?: string;
}

interface ZipCode {
  code: string;
  isSelected: boolean;
}

interface Schedule {
  day: Days;
  startTime: string;
  endTime: string;
  dayOff?: boolean;
}

export interface ISubscription {
  subscription: string;
  plan: string;
  name: string;
  priceId: string;
  subscribe: boolean;
  subscriptionAuthId: string;
}

export interface IUser {
  _id?: string | mongoose.Types.ObjectId;
  firstName?: string;
  socialAuthId?: string;
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
  online: boolean;
  volunteer?: string[];
  services?: string[] | IService[];
  subscription?: ISubscription;
  locationType?: EUserLocationType;
  location?: Location[];
  taskLocation?: Location[];
  selectedLocation?: Location;
  taskSelectedLocation?: Location;
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
  fcmTokens?: string[];
  refreshToken?: string;
  otpCode?: number | null;
  otpExpiredAt?: number | null;
  isDeleted?: boolean;
  createdAt?: Date | Moment;
  updatedAt?: Date | Moment;
  deletedAt?: Date | Moment | null;
  averageRating: number;
  ratingCount: number;
  isContactPermission?: boolean;
  callToken?: string;
  callDeviceType?: string;
  stripeCustomerId?: string;
  stripeConnectId: string;
  accountAuthorized?: boolean;
  allServices: IService[];
  stripeConnectAccountRequirementsDue: {
    pastDue: string[];
    currentlyDue: string[];
    eventuallyDue: string[];
    payoutEnabled: boolean;
    chargesEnabled: boolean;
    disabledReason: string;
  };
  wallet?: string;
  reportedStatus: string;
}

export interface IUserWithSchedule extends IUser {
  schedule?: Schedule[];
}

export interface IUserDoc extends IUser, Document {
  _id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
