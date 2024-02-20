"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorize = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const environment_config_1 = require("../config/environment.config");
const enums_1 = require("../database/interfaces/enums");
const reponseapi_helper_1 = require("../api/helpers/reponseapi.helper");
const token_service_1 = __importDefault(require("../api/services/token.service"));
class Authorize {
    constructor() {
        this.validateAuth = (req, res, next, isAdmin = false) => {
            if (!req.headers.authorization) {
                const response = reponseapi_helper_1.ResponseHelper.sendResponse(400);
                return res.status(response.code).json(response);
            }
            const token = req.headers.authorization.split(" ")[1];
            if (token) {
                // verifies secret and checks exp
                return jwt.verify(token, environment_config_1.JWT_SECRET_KEY, async function (err, decoded) {
                    if (err || typeof decoded === "string") {
                        const response = reponseapi_helper_1.ResponseHelper.sendResponse(401);
                        return res.status(response.code).json(response);
                    }
                    const exists = await new token_service_1.default().validateToken(decoded?.userId, token);
                    if (exists === null) {
                        const response = reponseapi_helper_1.ResponseHelper.sendResponse(401);
                        return res.status(response.code).json(response);
                    }
                    if (isAdmin &&
                        decoded?.role !== enums_1.EUserRole.admin &&
                        decoded?.role !== enums_1.EUserRole.subAdmin) {
                        const response = reponseapi_helper_1.ResponseHelper.sendResponse(401, "You must be admin to access this route");
                        return res.status(response.code).json(response);
                    }
                    req.locals = {
                        auth: { userId: decoded?.userId, role: decoded?.role },
                    };
                    return next();
                });
            }
        };
        this.validateAuthSocket = (authtoken) => {
            if (!authtoken) {
                const response = reponseapi_helper_1.ResponseHelper.sendResponse(400);
                return response.msg;
            }
            const token = authtoken.split(" ")[1];
            if (token) {
                // verifies secret and checks exp
                return jwt.verify(token, environment_config_1.JWT_SECRET_KEY, async function (err, decoded) {
                    if (err || typeof decoded === "string") {
                        const response = reponseapi_helper_1.ResponseHelper.sendResponse(401);
                        return response.msg;
                    }
                    const exists = await new token_service_1.default().validateToken(decoded?.userId, token);
                    if (exists === null) {
                        const response = reponseapi_helper_1.ResponseHelper.sendResponse(401);
                        return response.msg;
                    }
                    return decoded;
                });
            }
        };
    }
}
exports.Authorize = Authorize;
//# sourceMappingURL=authorize.middleware.js.map