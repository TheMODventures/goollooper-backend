'use strict';

const { Types } = require('mongoose');

const { createSubscription, getSubscriptions, getSubscription, updateSubscription, deleteSubscription, updateOneSubscription } = require('../models/subscriptionModel');
const { createValidation, updateValidation, addSubscriptionPlanValidation, updateSubscriptionPlanValidation } = require('../validation/subscriptionValidation');
const { generateResponse, parseBody } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');

exports.createSubscription = async (req, res, next) => {
    const body = parseBody(req.body);

    // validation
    const { error } = createValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        // checking if already exists
        const exists = await getSubscription({ name: body.name });
        if (exists) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'Subscription already exists'
        });

        const subscription = await createSubscription(body);
        generateResponse(subscription, 'Subscription added successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.addSubscriptionPlan = async (req, res, next) => {
    const { id } = req.params;
    const body = parseBody(req.body);

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please provide id properly.'
    });

    const { error } = addSubscriptionPlanValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const subscription = await updateSubscription(id, { $push: { plans: body } });
        if (!subscription) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'subscription not found.'
        });
        generateResponse(subscription, 'Subscription-Plan added successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.getSubscriptions = async (req, res, next) => {
    const { name = "" } = req.query;

    let query = [
        {
            $match: {
                name: { $regex: name, $options: 'i' },
                isDeleted: false
            },
        }
    ];

    try {
        const subscriptions = await getSubscriptions({ query });

        if (subscriptions?.length === 0) {
            generateResponse(subscriptions, 'Subscriptions not available', res);
            return;
        }

        generateResponse(subscriptions, 'Subscriptions found successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.getSubscription = async (req, res, next) => {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please provide id properly.'
    });

    try {
        const subscription = await getSubscription({ _id: id });
        if (!subscription) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(subscription, 'Subscription found', res);
    } catch (error) {
        next(error);
    }
}

exports.updateSubscription = async (req, res, next) => {
    const { id } = req.params;
    const body = parseBody(req.body);

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    });

    // validation
    const { error } = updateValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const subscription = await updateSubscription(id, { $set: body });
        if (!subscription) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(subscription, 'Subscription updated successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.updateSubscriptionPlan = async (req, res, next) => {
    const { subscriptionId, id } = req.params;
    const body = parseBody(req.body);

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    });

    // validation
    const { error } = updateSubscriptionPlanValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const updateValues = {};
        for (let field in body) {
            updateValues[`plans.$.${field}`] = body[field];
        }
        const subscription = await updateOneSubscription({ _id: subscriptionId, 'plans._id': id }, { $set: updateValues });
        if (!subscription) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(subscription, 'Subscriptions-Plan updated successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.deleteSubscription = async (req, res, next) => {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please provide id properly.'
    });

    try {
        const subscription = await deleteSubscription(id);
        if (!subscription) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(subscription, 'Subscription removed!', res);
    } catch (error) {
        next(error);
    }
}

exports.deleteSubscriptionPlan = async (req, res, next) => {
    const { subscriptionId, id } = req.params;

    if (!subscriptionId || !Types.ObjectId.isValid(subscriptionId)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide subscriptionId properly.'
    })
    else if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    })

    try {
        const subscription = await updateSubscription(
            subscriptionId,
            { $pull: { plans: { _id: id } } }
        );
        if (!subscription) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Subscription not found.'
        });
        generateResponse(subscription, 'Subscription-Plan deleted successfully', res);
    } catch (error) {
        next(error);
    }
}