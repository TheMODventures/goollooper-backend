"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelper = void 0;
const constant_1 = require("../../constant");
class ResponseApiHelper {
    constructor() {
        this.responses = {
            201: {
                code: 201,
                msg: constant_1.SUCCESS_DATA_INSERTION_PASSED,
                status: true,
            },
            400: {
                code: 400,
                msg: constant_1.ERROR_BADREQUEST,
                status: false,
            },
            401: {
                code: 401,
                msg: constant_1.ERROR_UNAUTHORIZED,
                status: false,
            },
            403: {
                code: 403,
                msg: constant_1.ERROR_FORBIDDEN,
                status: false,
            },
            404: {
                code: 404,
                msg: constant_1.ERROR_NOTFOUND,
                status: false,
            },
            409: {
                code: 409,
                msg: constant_1.ERROR_CONFLICT,
                status: false,
            },
            422: {
                code: 422,
                msg: constant_1.ERROR_VALIDATION,
                status: false,
            },
        };
    }
    sendSuccessResponse(msg, data, total) {
        let response = {
            code: 200,
            status: true,
            msg: msg,
            data: data ?? {},
        };
        total && (response.total = total);
        return response;
    }
    sendResponse(statusCode, data) {
        const resobj = this.responses;
        const code = statusCode;
        let result = resobj[code];
        if (result == undefined) {
            result = {
                code: 500,
                msg: constant_1.ERROR_SERVER,
                status: false,
            };
        }
        (data == typeof "string" || (data && Object.keys(data).length > 0)) &&
            (result.data = data);
        return result;
    }
    sendSignTokenResponse(statusCode, msg, data, token) {
        return {
            code: statusCode,
            status: true,
            msg: msg,
            data: data ?? {},
            accessToken: token?.accessToken,
            refreshToken: token?.refreshToken,
        };
    }
}
exports.ResponseHelper = new ResponseApiHelper();
//# sourceMappingURL=reponseapi.helper.js.map