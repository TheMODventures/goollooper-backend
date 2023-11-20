const Joi = require('joi');

// create validation
exports.createValidation = Joi.object({
    name: Joi.string().required(),
    tagline: Joi.string().required(),
    description: Joi.string().required(),
});

// add subscription-plan validation
exports.addSubscriptionPlanValidation = Joi.object({
    price: Joi.number().required(),
    duration: Joi.string().valid('day', 'month', 'year').required(),
});

// update validation
exports.updateValidation = Joi.object({
    name: Joi.string().optional(),
    tagline: Joi.string().optional(),
    description: Joi.string().optional(),
});

// update subscription-plan validation
exports.updateSubscriptionPlanValidation = Joi.object({
    price: Joi.number().optional(),
    duration: Joi.string().valid('day', 'month', 'year').optional(),
});