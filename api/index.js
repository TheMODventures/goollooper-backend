'use strict';

const { Router } = require('express');

const rootApi = require('./rootApi');
const AuthAPI = require('./authApi');
const ServiceAPI = require('./serviceApi');
const SubscriptionAPI = require('./subscriptionApi');


class API {
    constructor(app) {
        this.app = app;
        this.router = Router();
        this.routeGroups = [];
    }

    loadRouteGroups() {
        this.routeGroups.push(new rootApi());
        this.routeGroups.push(new AuthAPI());
        this.routeGroups.push(new ServiceAPI());
        this.routeGroups.push(new SubscriptionAPI());
    }

    setContentType(req, res, next) {
        res.set('Content-Type', 'application/json');
        next();
    }

    registerGroups() {
        this.loadRouteGroups();
        this.routeGroups.forEach((rg) => {
            console.log('Route group: ' + rg.getRouterGroup());
            this.app.use('/api' + rg.getRouterGroup(), this.setContentType, rg.getRouter());
        });
    }
}

module.exports = API;