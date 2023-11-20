'use strict';

const { Schema, model } = require("mongoose");

const { SUBSCRIPTION_DURATION } = require('../utils/constants');

const subscriptionSchema = new Schema({
  name: { type: String, required: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  plans: [{
    price: { type: String, required: true },
    duration: { type: String, enum: Object.values(SUBSCRIPTION_DURATION), default: SUBSCRIPTION_DURATION.PER_DAY },
  }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

const SubscriptionModel = model("Subscriptions", subscriptionSchema);

// create
exports.createSubscription = (obj) => SubscriptionModel.create(obj);

// get
exports.getSubscription = (query) => SubscriptionModel.findOne(query);

// get all 
exports.getSubscriptions = (query) => SubscriptionModel.find(query);

// update by id
exports.updateSubscription = (id, obj) => SubscriptionModel.findByIdAndUpdate(id, obj, { new: true });

// update one
exports.updateOneSubscription = (query, obj) => SubscriptionModel.findOneAndUpdate(query, obj, { new: true });

// update multiple
exports.updateSubscriptions = (query, obj) => SubscriptionModel.updateMany(query, obj);

// delete by id (soft delete)
exports.deleteSubscription = (id) => SubscriptionModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
