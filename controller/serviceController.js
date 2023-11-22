'use strict';

const { Types } = require('mongoose');

const { createService, getServices, getService, updateService, deleteService, updateOneService } = require('../models/serviceModel');
const { createValidation, updateValidation, addSubServiceValidation, updateSubServiceValidation } = require('../validation/serviceValidation');
const { generateResponse, parseBody } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');

exports.createService = async (req, res, next) => {
    const body = parseBody(req.body);

    // validation
    const { error } = createValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        // checking if already exists
        const exists = await getService({ title: body.title });
        if (exists) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'Service already exists'
        });

        const service = await createService(body);
        generateResponse(service, 'Service added successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.addSubService = async (req, res, next) => {
    const { id } = req.params;
    const body = parseBody(req.body);

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    });

    const { error } = addSubServiceValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const service = await updateService(id, { $push: { subServices: body } });
        if (!service) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'service not found.'
        });
        generateResponse(service, 'Sub-Service added successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.getServices = async (req, res, next) => {
    const { title = "" } = req.query;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let query = [
        {
            $match: {
                title: { $regex: title, $options: 'i' },
                isDeleted: false
            },
        }
    ];

    try {
        const services = await getServices({ query, page, limit });

        if (services?.services?.length === 0) {
            generateResponse(null, 'Services not available', res);
            return;
        }

        generateResponse(services, 'Services found successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.getService = async (req, res, next) => {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    });

    try {
        const service = await getService({ _id: id });
        if (!service) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(service, 'Service found', res);
    } catch (error) {
        next(error);
    }
}

exports.updateService = async (req, res, next) => {
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
        const service = await updateService(id, { $set: body });
        if (!service) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(service, 'Service updated successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.updateSubService = async (req, res, next) => {
    const { serviceId, id } = req.params;
    const body = parseBody(req.body);

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    });

    // validation
    const { error } = updateSubServiceValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    try {
        const updateValues = {};
        for (let field in body) {
            updateValues[`subServices.$.${field}`] = body[field];
        }
        const service = await updateOneService({ _id: serviceId, 'subServices._id': id }, { $set: updateValues });
        if (!service) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(service, 'Sub-Service updated successfully', res);
    } catch (error) {
        next(error);
    }
}

exports.deleteService = async (req, res, next) => {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    });

    try {
        const service = await deleteService(id);
        if (!service) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'id not found.'
        });

        generateResponse(service, 'Service removed!', res);
    } catch (error) {
        next(error);
    }
}

exports.deleteSubService = async (req, res, next) => {
    const { serviceId, id } = req.params;

    if (!serviceId || !Types.ObjectId.isValid(serviceId)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide serviceId properly.'
    })
    else if (!id || !Types.ObjectId.isValid(id)) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: 'Please, provide id properly.'
    })

    try {
        const service = await updateService(
            serviceId,
            { $pull: { subServices: { _id: id } } }
        );
        if (!service) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'service not found.'
        });
        generateResponse(service, 'Sub-Service deleted successfully', res);
    } catch (error) {
        next(error);
    }
}