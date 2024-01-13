import { NextFunction, Request, Response } from "express";
import * as _ from "lodash";
import * as jwt from "jsonwebtoken";

import { JWT_SECRET_KEY } from "../config/environment.config";
import { EUserRole } from "../database/interfaces/enums";
import { ResponseHelper } from "../api/helpers/reponseapi.helper";
import TokenService from "../api/services/token.service";

export class Authorize {
  validateAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      const response = ResponseHelper.sendResponse(400);
      return res.status(response.code).json(response);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      // verifies secret and checks exp
      return jwt.verify(token, JWT_SECRET_KEY!, async function (err, decoded) {
        if (err || typeof decoded === "string") {
          const response = ResponseHelper.sendResponse(401);
          return res.status(response.code).json(response);
        }

        const exists = await new TokenService().validateToken(
          decoded?.userId,
          token
        );
        if (exists === null) {
          const response = ResponseHelper.sendResponse(401);
          return res.status(response.code).json(response);
        }

        req.locals = {
          auth: { userId: decoded?.userId, role: decoded?.role },
        };

        return next();
      });
    }
  };

  validateAuthSocket: any = (authtoken: string) => {
    if (!authtoken) {
      const response = ResponseHelper.sendResponse(400);
      return response.msg;
    }
    const token = authtoken.split(" ")[1];
    if (token) {
      // verifies secret and checks exp
      return jwt.verify(token, JWT_SECRET_KEY!, async function (err, decoded) {
        if (err || typeof decoded === "string") {
          const response = ResponseHelper.sendResponse(401);
          return response.msg;
        }

        const exists = await new TokenService().validateToken(
          decoded?.userId,
          token
        );
        if (exists === null) {
          const response = ResponseHelper.sendResponse(401);
          return response.msg;
        }

        return decoded;
      });
    }
  };
}
