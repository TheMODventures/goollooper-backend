const Joi = require('joi');

// create service validation
exports.createValidation = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().valid('volunteer', 'interest').required(),
});

// add sub-service validation
exports.addSubServiceValidation = Joi.object({
    title: Joi.string().required(),
});

// update service validation
exports.updateValidation = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().valid('volunteer', 'interest').optional(),
});

// update sub-service validation
exports.updateSubServiceValidation = Joi.object({
    title: Joi.string().required(),
});