const Joi = require('joi');
const { GENDERS, ROLES, LOCATIONS_TYPES } = require('../utils/constants');

exports.resetPasswordValidation = Joi.object({
    password: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

exports.changePasswordValidation = Joi.object({
    oldPassword: Joi.string().min(8).max(30).required(),
    newPassword: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

exports.updateProfileValidation = Joi.object({
    firstName: Joi.string().regex(/^[a-zA-Z]+[0-9]*$/).min(3).max(30).required(),
    lastName: Joi.string().regex(/^[a-zA-Z]+[0-9]*$/).min(3).max(30).allow(null, ''),
    userName: Joi.string().min(3).max(20).required(),
    // email: Joi.string().email().optional(),
    gender: Joi.string().valid(...Object.values(GENDERS)).default(GENDERS.MALE),
    age: Joi.number().optional(),
    countryCode: Joi.string().optional(),
    phoneCode: Joi.string().optional(),
    phone: Joi.string().optional(),
    about: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(ROLES)).optional(),
    volunteer: Joi.array().items(
        Joi.object({
            service: Joi.string(),
            subService: Joi.string(),
        })
    ).optional(),
    services: Joi.array().items(
        Joi.object({
            service: Joi.string(),
            subService: Joi.string(),
        })
    ).optional(),
    subscription: Joi.object({
        subscription: Joi.string(),
        plan: Joi.string(),
    }).optional(),
    locationType: Joi.string().valid(...Object.values(LOCATIONS_TYPES)).default(LOCATIONS_TYPES.LOCAL),
    location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2),
    }).default({ type: 'Point', coordinates: [0, 0] }).optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    zipCode: Joi.array().items(
        Joi.object({
            code: Joi.string(),
            isSelected: Joi.boolean(),
        })
    ).optional(),
    company: Joi.object({
        name: Joi.string(),
        logo: Joi.string(),
        website: Joi.string(),
        affiliation: Joi.string(),
        publication: Joi.string(),
        resume: Joi.string(),
    }).optional(),
    reference: Joi.object({
        name: Joi.string(),
        contact: Joi.string(),
    }).optional(),
});

exports.checkUsernameAvailabilityValidation = Joi.object({
    userName: Joi.string().min(3).max(20).required(),
});