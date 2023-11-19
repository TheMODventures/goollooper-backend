'use strict';

const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const { SERVICE_TYPES } = require('../utils/constants');
const { getMongooseAggregatePaginatedData } = require("../utils");

const serviceSchema = new Schema({
  title: { type: String, default: null },
  subServices: [{
    title: { type: String, default: null },
  }],
  type: { type: String, enum: Object.values(SERVICE_TYPES), default: SERVICE_TYPES.VOLUNTEER },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

serviceSchema.plugin(mongoosePaginate);
serviceSchema.plugin(aggregatePaginate);

const ServiceModel = model("Service", serviceSchema);

// create new service
exports.createService = (obj) => ServiceModel.create(obj);

// get service
exports.getService = (query) => ServiceModel.findOne(query);

// get all services
exports.getServices = async ({ query, page, limit, responseKey = 'services' }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: ServiceModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};

// get all services without pagination
// exports.getServices = (query) => ServiceModel.find(query);

// update service by id
exports.updateService = (id, obj) => ServiceModel.findByIdAndUpdate(id, obj, { new: true });

// update one service
exports.updateOneService = (query, obj) => ServiceModel.findOneAndUpdate(query, obj, { new: true });

// update services
exports.updateServices = (query, obj) => ServiceModel.updateMany(query, obj);

// delete service by id (soft delete)
exports.deleteService = (id) => ServiceModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
