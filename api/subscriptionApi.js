'use strict';

const router = require('express').Router();

const { getSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription, addSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } = require('../controller/subscriptionController');
const authMiddleware = require('../middlewares/Auth');
const { ROLES } = require('../utils/constants');

class SubscriptionAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;

        router.get('/', authMiddleware(Object.values(ROLES)), getSubscriptions);
        router.get('/:id', authMiddleware(Object.values(ROLES)), getSubscription);
        router.post('/', authMiddleware(Object.values(ROLES)), createSubscription);
        router.post('/subscription-plan/:id', authMiddleware(Object.values(ROLES)), addSubscriptionPlan);
        router.put('/:id', authMiddleware(Object.values(ROLES)), updateSubscription);
        router.put('/:subscriptionId/subscription-plan/:id', authMiddleware(Object.values(ROLES)), updateSubscriptionPlan);
        router.delete('/:id', authMiddleware(Object.values(ROLES)), deleteSubscription);
        router.delete('/:subscriptionId/subscription-plan/:id', authMiddleware(Object.values(ROLES)), deleteSubscriptionPlan);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/subscription';
    }
}

module.exports = SubscriptionAPI;
