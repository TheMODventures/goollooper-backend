import {
  ERROR_BADREQUEST,
  ERROR_CONFLICT,
  ERROR_FORBIDDEN,
  ERROR_NOTFOUND,
  ERROR_SERVER,
  ERROR_UNAUTHORIZED,
  ERROR_VALIDATION,
  SUCCESS_DATA_INSERTION_PASSED,
} from "../../constant";

class ResponseApiHelper {
  private responses = {
    201: {
      code: 201,
      msg: SUCCESS_DATA_INSERTION_PASSED,
      status: true,
    },
    400: {
      code: 400,
      msg: ERROR_BADREQUEST,
      status: false,
    },
    401: {
      code: 401,
      msg: ERROR_UNAUTHORIZED,
      status: false,
    },
    403: {
      code: 403,
      msg: ERROR_FORBIDDEN,
      status: false,
    },
    404: {
      code: 404,
      msg: ERROR_NOTFOUND,
      status: false,
    },
    409: {
      code: 409,
      msg: ERROR_CONFLICT,
      status: false,
    },
    422: {
      code: 422,
      msg: ERROR_VALIDATION,
      status: false,
    },
  };

  sendSuccessResponse(
    msg: string,
    data?: string | object,
    total?: number
  ): ApiResponse {
    let response: ApiResponse = {
      code: 200,
      status: true,
      msg: msg,
      data: data ?? {},
    };
    total && (response.total = total);
    return response;
  }

  sendResponse(statusCode: number, data?: string | object): ApiResponse {
    const resobj = this.responses;
    const code = statusCode as keyof typeof resobj;
    let result: ApiResponse | undefined = resobj[code];
    if (result == undefined) {
      result = {
        code: 500,
        msg: ERROR_SERVER,
        status: false,
      };
    }
    (data == typeof "string" || (data && Object.keys(data).length > 0)) &&
      (result.data = data);
    return result;
  }

  sendSignTokenResponse(
    statusCode: number,
    msg: string,
    data?: string | object,
    token?: JwtToken
  ): ApiResponse {
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

export const ResponseHelper = new ResponseApiHelper();
