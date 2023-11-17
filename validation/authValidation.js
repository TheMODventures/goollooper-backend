const Joi = require('joi');

exports.registerUserValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
    fcmToken: Joi.string().required(),
    role: Joi.string().valid('user', 'admin', 'service_provider').default('user')
});

exports.loginUserValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
    fcmToken: Joi.string().required(),
});

exports.refreshTokenValidation = Joi.object({
    refreshToken: Joi.string().required(),
});

exports.registerAdminValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
});

exports.loginAdminValidation = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(30).required(),
});

exports.sendCodeValidation = Joi.object({
    email: Joi.string().email().required(),
});

exports.codeValidation = Joi.object({
    code: Joi.string().min(6).max(6).required(),
});