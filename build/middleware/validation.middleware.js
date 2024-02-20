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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = void 0;
const _ = __importStar(require("lodash"));
const reponseapi_helper_1 = require("../api/helpers/reponseapi.helper");
class Validation {
    constructor() {
        this.reporter = (useYupError, validator_name) => {
            const Schemas = require("../validator/" + validator_name + ".validate");
            const _useYupError = _.isBoolean(useYupError) && useYupError;
            const _supportedMethods = ["post", "patch", "delete", "get", "put"];
            // Yup validation options
            const _validationOptions = {
                abortEarly: false,
                strict: true, // strict check all the key
                // stripUnknown: true, // remove unknown keys from the validated data
            };
            return async (req, res, next) => {
                const route = req.route.path.split("/:")[0];
                const method = req.method.toLowerCase();
                if (_.includes(_supportedMethods, method) && _.has(Schemas, route)) {
                    // get schema for the current route
                    const _schema = _.get(Schemas, route);
                    if (_schema) {
                        try {
                            let validateObj = {};
                            if (req.is("multipart/form-data")) {
                                validateObj = {
                                    body: req.body,
                                    params: req.params,
                                    files: req.files,
                                    query: req.query, // The file object
                                };
                            }
                            else {
                                // Otherwise, use the default validateObj with body, params and query
                                validateObj = {
                                    body: req.body,
                                    params: req.params,
                                    query: req.query,
                                };
                            }
                            await _schema.validate(validateObj, _validationOptions);
                            return next();
                        }
                        catch (err) {
                            const YupError = err.errors.map((message) => {
                                return message.replace("body.", "");
                            });
                            const CustomError = [
                                "Invalid request data. Please review request and try again.",
                            ];
                            const response = reponseapi_helper_1.ResponseHelper.sendResponse(422, _useYupError ? YupError : CustomError);
                            return res.status(response.code).json(response);
                        }
                    }
                }
                return next();
            };
        };
    }
}
exports.Validation = Validation;
//# sourceMappingURL=validation.middleware.js.map