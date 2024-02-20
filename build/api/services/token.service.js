"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const token_repository_1 = require("../repository/token/token.repository");
const user_repository_1 = require("../repository/user/user.repository");
const environment_config_1 = require("../../config/environment.config");
class TokenService {
    constructor() {
        this.create = async (userId, role) => {
            try {
                const accessToken = this.generateJwtToken(userId, role, environment_config_1.JWT_SECRET_KEY, environment_config_1.JWT_SECRET_EXPIRE_IN);
                const refreshToken = this.generateJwtToken(userId, role, environment_config_1.JWT_REFRESH_SECRET_KEY, environment_config_1.JWT_REFRESH_SECRET_EXPIRE_IN);
                const token = {
                    userId: userId,
                    role: role,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                };
                const response = await this.tokenRepository.create(token);
                return {
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                };
            }
            catch (err) {
                throw new Error("Something went wrong while creating token");
            }
        };
        this.loggedOut = async (userId, refreshToken, fcmToken) => {
            if (fcmToken)
                await this.userRepository.updateByOne({ _id: userId }, { $pull: { fcmTokens: fcmToken } });
            return await this.tokenRepository.deleteMany({
                userId: userId,
                refreshToken: refreshToken,
            });
        };
        this.setNewToken = async (tokenId, userId, role, refreshToken) => {
            try {
                const newTokenId = tokenId.toString();
                const newAccessToken = this.generateJwtToken(userId, role, environment_config_1.JWT_SECRET_KEY, environment_config_1.JWT_SECRET_EXPIRE_IN);
                this.tokenRepository.updateById(newTokenId, {
                    accessToken: newAccessToken,
                });
                return {
                    accessToken: newAccessToken,
                    refreshToken: refreshToken,
                };
            }
            catch (error) {
                throw new Error("Something went wrong");
            }
        };
        this.validateToken = async (userId, accessToken, refreshToken) => {
            let tokenFilter = {};
            userId && (tokenFilter.userId = userId);
            accessToken && (tokenFilter.accessToken = accessToken);
            refreshToken && (tokenFilter.refreshToken = refreshToken);
            const response = await this.tokenRepository.getOne(tokenFilter);
            return response;
        };
        this.tokenRepository = new token_repository_1.TokenRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    generateJwtToken(userId, role, jwtKey, jwtExpire) {
        const payload = {
            userId: userId,
            role: role,
        };
        const token = (0, jsonwebtoken_1.sign)(payload, jwtKey, {
            expiresIn: jwtExpire,
        });
        return token;
    }
}
exports.default = TokenService;
//# sourceMappingURL=token.service.js.map