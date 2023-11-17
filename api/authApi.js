'use strict';

const router = require('express').Router();

const {
    register,
    login,
    logout,
    getRefreshToken,
    sendVerificationCode,
    verifyCode,
    resetPassword,
    registerAdmin,
    loginAdmin,
} = require('../controller/authController');
const authMiddleware = require('../middlewares/Auth');
const { ROLES } = require('../utils/constants');

class AuthAPI {
    constructor() {
        this.router = router;
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;

        router.post('/register-admin', registerAdmin);
        router.post('/login-admin', loginAdmin);

        router.post('/register', register);
        router.post('/login', login);
        router.post('/logout', authMiddleware(Object.values(ROLES)), logout);

        router.post('/send-code', sendVerificationCode);
        router.put('/verify-code', verifyCode);
        router.put('/reset-password', authMiddleware(Object.values(ROLES)), resetPassword);

        router.put('/refresh-token', getRefreshToken);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/auth';
    }
}

module.exports = AuthAPI;
