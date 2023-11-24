'use strict';

const router = require('express').Router();

const authMiddleware = require('../middlewares/Auth');
const { getUser, userNameAvailability, updateProfile, deleteUser } = require('../controller/userController');
const { upload } = require("../utils/s3Upload");
const { ROLES } = require('../utils/constants');

class SubscriptionAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.get('/:id', authMiddleware(Object.values(ROLES)), getUser);
        router.post('/check-username', authMiddleware(Object.values(ROLES)), userNameAvailability);
        router.put('/', authMiddleware(Object.values(ROLES)),
            upload.fields([
                { name: "profileImage", maxCount: 1 },
                { name: "gallery", maxCount: 10 },
                { name: "visuals", maxCount: 10 },
                { name: "certificates", maxCount: 10 },
                { name: "licenses", maxCount: 10 },
                { name: "insurances", maxCount: 10 }
            ]),
            updateProfile);
        router.delete('/delete-account', authMiddleware(Object.values(ROLES)), deleteUser);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = SubscriptionAPI;
