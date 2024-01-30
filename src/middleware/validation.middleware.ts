import * as _ from "lodash";
import { NextFunction, Request, Response } from "express";
import { ResponseHelper } from "../api/helpers/reponseapi.helper";
import multer, { Multer } from "multer";

export class Validation {
  reporter = (useYupError: boolean, validator_name: string) => {
    const Schemas = require("../validator/" + validator_name + ".validate");
    const _useYupError = _.isBoolean(useYupError) && useYupError;
    const _supportedMethods = ["post", "patch", "delete", "get", "put"];
    // Yup validation options
    const _validationOptions = {
      abortEarly: false, // abort after the last validation error
      strict: true, // strict check all the key
      // stripUnknown: true, // remove unknown keys from the validated data
    };

    return async (req: Request, res: Response, next: NextFunction) => {
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
                body: req.body, // Other form fields
                params: req.params,
                files: req.files,
                query: req.query, // The file object
              };
            } else {
              // Otherwise, use the default validateObj with body, params and query
              validateObj = {
                body: req.body,
                params: req.params,
                query: req.query,
              };
            }

            await _schema.validate(validateObj, _validationOptions);
            return next();
          } catch (err: any) {
            const YupError = err.errors.map((message: string) => {
              return message.replace("body.", "");
            });
            const CustomError = [
              "Invalid request data. Please review request and try again.",
            ];
            const response = ResponseHelper.sendResponse(
              422,
              _useYupError ? YupError : CustomError
            );
            return res.status(response.code).json(response);
          }
        }
      }
      return next();
    };
  };
}
