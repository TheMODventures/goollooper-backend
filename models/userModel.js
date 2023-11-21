'use strict';

const { Schema, model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const { ROLES, GENDERS, LOCATIONS_TYPES } = require('../utils/constants');
const { getMongooseAggregatePaginatedData } = require("../utils");

const userSchema = new Schema({
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    userName: { type: String, default: null, unique: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    gender: { type: String, enum: Object.values(GENDERS), default: GENDERS.MALE },
    age: { type: Number, default: null },
    countryCode: { type: String },  // like 'PK' alpha-2 format
    phoneCode: { type: String },  // like '+92'
    phone: { type: String, default: null },
    completePhone: { type: String, select: false },
    profileImage: { type: String },
    gallery: [String],
    about: { type: String, default: null },
    role: { type: String, default: ROLES.USER, enum: Object.values(ROLES) },
    volunteer: [{
        service: { type: Schema.Types.ObjectId, ref: 'Service' },
        subService: { type: Schema.Types.ObjectId, ref: 'SubService' },
    }],
    services: [{
        service: { type: Schema.Types.ObjectId, ref: 'Service' },
        subService: { type: Schema.Types.ObjectId, ref: 'SubService' },
    }],
    subscription: {
        subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
        plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
    },
    locationType: { type: String, default: LOCATIONS_TYPES.LOCAL, enum: Object.values(LOCATIONS_TYPES) },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number, Number] },
    },
    state: { type: String, default: null },
    city: { type: String, default: null },
    country: { type: String, default: null },
    zipCode: [
        {
            code: { type: String, default: null },
            isSelected: { type: Boolean, default: false },
        }],
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
    fcmToken: { type: String },
    refreshToken: { type: String, select: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// register pagination plugin to user model
userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

const UserModel = model('User', userSchema);

// create new user
exports.createUser = (obj) => UserModel.create(obj);

// find user by query
exports.findUser = (query) => UserModel.findOne(query);

// update user
exports.updateUser = (query, obj) => UserModel.findOneAndUpdate(query, obj, { new: true });

// get all users
exports.getAllUsers = async ({ query, page, limit, responseKey = 'data' }) => {
    const { data, pagination } = await getMongooseAggregatePaginatedData({
        model: UserModel,
        query,
        page,
        limit,
    });

    return { [responseKey]: data, pagination };
};

// generate token
exports.generateToken = (user) => {
    const token = sign({
        id: user._id,
        email: user.email,
        role: user.role,
    }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return token;
};

// generate refresh token
exports.generateRefreshToken = (user) => {
    // Generate a refresh token
    const refreshToken = sign({ id: user._id }, process.env.REFRESH_JWT_SECRET, {
        expiresIn: process.env.REFRESH_JWT_EXPIRATION, // Set the expiration time for the refresh token
    });

    return refreshToken;
};

// generate reset token
exports.generateResetToken = (user) => {
    const { RESET_TOKEN_EXPIRATION, JWT_SECRET } = process.env;

    const token = sign({
        id: user._id,
        email: user.email,
        role: user.role,
    }, JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRATION });

    return token;
};

// get FcmToken
exports.getFcmToken = async (userId) => {
    const { fcmToken } = await UserModel.findById(userId);
    return fcmToken;
}

// remove user ( HARD DELETE)
exports.removeUser = (userId) => UserModel.findByIdAndDelete(userId);