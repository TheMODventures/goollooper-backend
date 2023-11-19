'use strict';

const { compare, hash } = require('bcrypt');

const {
    createUser,
    findUser,
    generateToken,
    updateUser,
    generateRefreshToken,
    generateResetToken,
} = require('../models/userModel');
const {
    registerUserValidation,
    loginUserValidation,
    refreshTokenValidation,
    registerAdminValidation,
    loginAdminValidation,
    sendCodeValidation,
    codeValidation
} = require('../validation/authValidation');
const { resetPasswordValidation } = require('../validation/userValidation');
const { deleteOTPs, addOTP, getOTP } = require('../models/otpModel');
const { STATUS_CODES, ROLES } = require('../utils/constants');
const { generateResponse, parseBody, generateRandomOTP } = require('../utils');
const { sendEmail } = require('../utils/mailer');

// register user
exports.register = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = registerUserValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    // body.completePhone = body.phoneCode + body.phone;

    try {
        const userWithEmail = await findUser({ email: body?.email, isDeleted: false });
        if (userWithEmail) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'Email already exists'
        });

        // hash password
        const hashedPassword = await hash(body.password, 10);
        body.password = hashedPassword;

        // create user in db
        let newUser = await createUser(body);

        const accessToken = generateToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        req.session.accessToken = accessToken;

        // update user with refreshToken
        const user = await updateUser({ _id: newUser._id }, { $set: { refreshToken } });

        sendVerificationCode(body.email);

        generateResponse({ user, accessToken, refreshToken }, 'Registered successfully', res);
    } catch (error) {
        next(error);
    }
}

// login user
exports.login = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = loginUserValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        let user = await findUser({ email: body?.email, isDeleted: false, role: { $ne: ROLES.ADMIN } }).select('+password');
        if (!user) return next({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: 'Invalid email or password'
        });

        const isMatch = await compare(body.password, user.password);
        if (!isMatch) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Invalid password'
        });

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        req.session.accessToken = accessToken;

        // update user with fcmToken
        user = await updateUser({ _id: user._id }, {
            $set: { fcmToken: body.fcmToken, refreshToken }
        });
        if (!user?.isVerified) {
            sendVerificationCode(user?.email);
        }
        generateResponse({ user, accessToken, refreshToken }, 'Logged in successfully', res);
    } catch (error) {
        next(error);
    }
};

// logout user
exports.logout = async (req, res, next) => {
    req.session = null;
    generateResponse(null, 'Logged out successfully', res);
}

// get refresh token
exports.getRefreshToken = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = refreshTokenValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const user = await findUser({ refreshToken: body.refreshToken, isDeleted: false }).select('+refreshToken');
        if (!user) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Invalid token'
        });

        const accessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);
        req.session.accessToken = accessToken;

        // update user with fcmToken
        const updatedUser = await updateUser({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });

        if (!updatedUser) return next({
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: 'Refresh token update failed'
        });

        generateResponse({ accessToken, refreshToken: newRefreshToken }, 'Token refreshed', res);
    } catch (error) {
        next(error);
    }
}

// send verification code
exports.sendVerificationCode = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = sendCodeValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    const { email } = body;
    const query = {
        isDeleted: false,
        email
    };

    try {
        const user = await findUser(query).select('email');
        if (!user) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Invalid information, record not found!'
        });

        // delete all previous OTPs
        await deleteOTPs(query);

        const otpObj = await addOTP({
            email: user?.email,
            otp: generateRandomOTP(),
        });

        // if (email) {
        //     await sendEmail({ email, subject: "Verification code", message: `Your code is ${otpObj.otp}` });
        // }

        generateResponse({ code: otpObj?.otp }, 'code generated successfully', res);
    } catch (error) {
        next(error);
    }
}

// reset password
exports.resetPassword = async (req, res, next) => {
    const userId = req.user.id;
    const body = parseBody(req.body);

    // Joi validation
    const { error } = resetPasswordValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const hashedPassword = await hash(body.password, 10);
        const user = await updateUser({ _id: userId }, { $set: { password: hashedPassword } });
        generateResponse(user, 'Password reset successfully', res);
    } catch (error) {
        next(error);
    }
}

// verify code
exports.verifyCode = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = codeValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const otpObj = await getOTP({ otp: body.code });
        if (!otpObj) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Invalid OTP!'
        });
        if (otpObj.isExpired()) return next({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: 'OTP expired'
        });

        const user = await findUser({
            isDeleted: false,
            email: otpObj.email
        });

        // throw error if user not found
        if (!user) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'User not found'
        });

        // const updatedUser = await updateUser({ email: otpObj.email }, { $set: { isVerified: true } });
        const accessToken = generateResetToken(user);
        await updateUser({ _id: user?._id }, { $set: { isVerified: true } });
        generateResponse({ accessToken }, 'Code verified successfully', res);
    } catch (error) {
        next(error);
    }
}

// register admin
exports.registerAdmin = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = registerAdminValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    body.role = ROLES.ADMIN;
    body.completePhone = body.phone;
    body.isVerified = true;

    try {
        const userWithEmail = await findUser({ email: body?.email, isDeleted: false });
        // const userWithPhone = await findUser({ completePhone: body?.completePhone, isDeleted: false });

        if (userWithEmail) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'Email already exists'
        });

        // hash password
        const hashedPassword = await hash(body.password, 10);
        body.password = hashedPassword;

        // create user in db
        const user = await createUser(body);
        const accessToken = generateToken(user);
        req.session.accessToken = accessToken;

        generateResponse({ user, accessToken }, 'Admin registered successfully', res);
    } catch (error) {
        next(error);
    }
}

// login admin
exports.loginAdmin = async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = loginAdminValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const user = await findUser({ email: body?.email, role: ROLES.ADMIN }).select('+password');
        if (!user) return next({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: 'Invalid email or password'
        });

        const isMatch = await compare(body.password, user.password);
        if (!isMatch) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Invalid password'
        });

        const accessToken = generateToken(user);
        req.session.accessToken = accessToken;

        generateResponse({ user, accessToken }, 'Admin Logged in successful', res);
    } catch (error) {
        next(error);
    }
};

const sendVerificationCode = async (email) => {
    const query = {
        isDeleted: false,
        email
    };

    try {
        const user = await findUser(query).select('email');
        if (!user) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Invalid information, record not found!'
        });

        // delete all previous OTPs
        await deleteOTPs(query);

        const otpObj = await addOTP({
            email: user?.email,
            otp: generateRandomOTP(),
        });

        // if (email) {
        //     await sendEmail({ email, subject: "Verification code", message: `Your code is ${otpObj.otp}` });
        // }

        return otpObj?.otp;
    } catch (error) {
        return error;
    }
}