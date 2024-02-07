'use strict';

const { generateResponse, parseBody } = require('../utils');
const { findUser, updateUser, } = require('../models/userModel');
const { getSubscription } = require('../models/subscriptionModel');
const { updateProfileValidation, checkUsernameAvailabilityValidation } = require('../validation/userValidation');
const { s3Uploadv3 } = require('../utils/s3Upload');
const { STATUS_CODES, LOCATIONS_TYPES, SCHEDULE_TYPES } = require('../utils/constants');

exports.getUser = async (req, res, next) => {
    const userId = req.query?.userId || req.user.id;
    // const fields = 'firstName lastName username email profileImage socialMediaLinks bio noOfCommunities noOfFollowers noOfFollowings subscribers';

    try {
        const user = await findUser({ _id: userId, isDeleted: false });
        if (!user) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Profile not found'
        });

        generateResponse(user, 'Profile found!', res);
    } catch (error) {
        next(error);
    }
}

exports.updateProfile = async (req, res, next) => {
    const body = parseBody(req.body);
    const userId = req.user.id;

    // validation
    const { error } = updateProfileValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    body.isProfileCompleted = true;

    try {
        let resume, logo = null;
        // uploading to s3
        if (req?.files?.profileImage?.length > 0) [body.profileImage] = await s3Uploadv3(req.files?.profileImage);
        if (req?.files?.gallery?.length > 0) body.gallery = await s3Uploadv3(req.files.gallery);
        if (req?.files?.visuals?.length > 0) body.visuals = await s3Uploadv3(req.files.visuals);
        if (req?.files?.certificates?.length > 0) body.certificates = await s3Uploadv3(req.files.certificates);
        if (req?.files?.licenses?.length > 0) body.licenses = await s3Uploadv3(req.files.licenses);
        if (req?.files?.insurances?.length > 0) body.insurances = await s3Uploadv3(req.files.insurances);
        if (req?.files?.companyLogo?.length > 0) logo = await s3Uploadv3(req.files.companyLogo);
        if (req?.files?.companyResume?.length > 0) resume = await s3Uploadv3(req.files.companyResume);

        if (resume?.length) {
            body.company = { ...body.company, resume: resume[0] };
        }
        if (logo?.length) {
            body.company = { ...body.company, logo: logo[0] };
        }

        if (body?.locationType &&
            body?.locationType === LOCATIONS_TYPES.LOCAL &&
            !body?.location?.length
        ) {
            return next({
                statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
                message: "Provide all location details",
            });
        }
        else if (body?.locationType &&
            body?.locationType === LOCATIONS_TYPES.LOCAL &&
            body?.location?.length
        ) {
            for (let i = 0; i < body.location.length; i++) {
                const element = body.location[i];
                if (
                    element?.coordinates?.length < 2 ||
                    !element?.state ||
                    !element?.city ||
                    !element?.country ||
                    !body?.zipCode?.length
                ) {
                    return next({
                        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
                        message: "Provide all location details",
                    });
                }
            }
        }

        if (body?.subscription?.subscription) {
            let subscription = await getSubscription({ _id: body.subscription.subscription });
            if (subscription.name?.toLowerCase() === "bsl" && body?.locationType !== LOCATIONS_TYPES.LOCAL) return next({
                statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
                message: 'Location should be local while subscribing to BSL'
            });
        }

        // let schedule = [];
        // if (body?.schedule?.length) {
        //     for (let i = 0; i < body?.schedule.length; i++) {
        //         let element = body?.schedule[i];
        //         if (element?.type === SCHEDULE_TYPES.DAY && element?.repetition > 0) {

        //         } else {

        //         }
        //     }
        // }

        if (body?.phoneCode && body?.phone) {
            body.completePhone = body.phoneCode + body.phone;
        }

        const user = await updateUser({ _id: userId }, { $set: body });
        generateResponse(user, 'Profile updated successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.userNameAvailability = async (req, res, next) => {
    const body = parseBody(req.body);

    // validation
    const { error } = checkUsernameAvailabilityValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    const { username } = body;

    try {
        const user = await findUser({ username, isDeleted: false });
        if (user) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'username not available'
        });
        generateResponse(null, 'username available', res);
    } catch (error) {
        next(error);
    }
}

// soft delete user
exports.deleteUser = async (req, res, next) => {
    const user = req.user.id;

    try {
        const userObj = await findUser({ _id: user, isDeleted: false });
        if (!userObj) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'User not found'
        });

        userObj.isDeleted = true;
        await userObj.save();

        generateResponse(userObj, 'User deleted successfully', res);
    } catch (error) {
        next(error);
    }
}