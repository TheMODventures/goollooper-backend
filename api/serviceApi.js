'use strict';

const router = require('express').Router();

const { getServices, getService, createService, updateService, deleteService, addSubService, deleteSubService, updateSubService } = require('../controller/serviceController');
const authMiddleware = require('../middlewares/Auth');
const { ROLES } = require('../utils/constants');

class ServiceAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;

        router.get('/', authMiddleware(Object.values(ROLES)), getServices);
        router.get('/:id', authMiddleware(Object.values(ROLES)), getService);
        router.post('/', authMiddleware(Object.values(ROLES)), createService);
        router.post('/sub-service/:id', authMiddleware(Object.values(ROLES)), addSubService);
        router.put('/:id', authMiddleware(Object.values(ROLES)), updateService);
        router.put('/:serviceId/sub-service/:id', authMiddleware(Object.values(ROLES)), updateSubService);
        router.delete('/:id', authMiddleware(Object.values(ROLES)), deleteService);
        router.delete('/:serviceId/sub-service/:id', authMiddleware(Object.values(ROLES)), deleteSubService);

        // router.post('/insert-data', authMiddleware(Object.values(ROLES)),
        //     upload.single("file"), addData);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/service';
    }
}

module.exports = ServiceAPI;
