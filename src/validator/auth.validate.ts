import { isObjectIdOrHexString } from "mongoose";
import phone from "phone";
import * as yup from "yup";
import * as jwt from "jsonwebtoken";

import { JWT_REFRESH_SECRET_KEY } from "../config/environment.config";
import { EUserRole } from "../database/interfaces/enums";
import AuthService from "../api/services/auth.service";

const authData = new AuthService();

const registerRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup
        .string()
        .email()
        .required()
        .test(
          "email_unique",
          "Email Already Exists",
          async (value: string | undefined) => {
            if (!value) {
              return true;
            }
            return !(await authData.validateEmail(value));
          }
        ),
      password: yup.string().required().min(6),
      fcmToken: yup.string().nullable(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const getAccessTokenRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      refreshToken: yup
        .string()
        .required()
        .test(
          "inavlid_token",
          "No Such Refresh Token Exsit!",
          (value: string | undefined) => {
            if (!value) {
              return true;
            }
            return jwt.verify(
              value,
              JWT_REFRESH_SECRET_KEY!,
              function (err, decoded) {
                if (err || typeof decoded == "string") {
                  return false;
                }
                return true;
              }
            );
          }
        ),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const loginRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup.string().email().required(),
      password: yup.string().min(3).required(),
      fcmToken: yup.string().nullable(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const logoutRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      refreshToken: yup
        .string()
        .required()
        .test(
          "inavlid_token",
          "No Such Refresh Token Exsit!",
          (value: string | undefined) => {
            if (!value) {
              return true;
            }
            return jwt.verify(
              value,
              JWT_REFRESH_SECRET_KEY!,
              function (err, decoded) {
                if (err || typeof decoded == "string") {
                  return false;
                }
                return true;
              }
            );
          }
        ),
      fcmToken: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updateData = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      role: yup
        .number()
        .oneOf([...Object.values(EUserRole).map((value) => Number(value))])
        .notRequired(),
      email: yup.string().when("role", (st: any, schema: any) => {
        return st && st[0] === Number(EUserRole.admin)
          ? yup.string().email().required()
          : yup.string().notRequired().strip();
      }),
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      emailAlert: yup.bool().notRequired().nullable(),
      inAppNotification: yup.bool().notRequired().nullable(),
      package: yup.lazy((value) => {
        if (!value) {
          return yup.string().notRequired().strip();
        }

        return yup
          .string()
          .required()
          .test("is-object-id", "Invalid Package Id", (value: string) => {
            return isObjectIdOrHexString(value);
          });
      }),
      risk: yup
        .object()
        .shape({
          description: yup.string().required(),
          score: yup.number().required(),
          total: yup.number().required(),
        })
        .notRequired()
        .noUnknown(),
      phoneNumber: yup
        .string()
        .nullable()
        .notRequired()
        .test(
          "invalid_number",
          "No such Phone Number exists!",
          (value: string | undefined | null) => {
            if (typeof value !== "string") {
              return true;
            }
            return phone(value!, { validateMobilePrefix: true }).isValid;
          }
        ),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const resetPassword = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      password: yup.string().min(6).required(),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match")
        .required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updatePassword = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      oldPassword: yup.string().min(6).required(),
      password: yup.string().min(6).required(),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match")
        .required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const forgetPassword = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup
        .string()
        .email()
        .required()
        .test(
          "email_unique",
          "Email Doesn't Exists",
          async (value: string | undefined) => {
            if (!value) {
              return true;
            }
            return !!(await authData.validateEmail(value));
          }
        ),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const resendOtp = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup.string().email().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const verifyOtp = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      code: yup
        .number()
        .required()
        .test(
          "len",
          "OTP code must be exactly 6 digits",
          (val: number | undefined) => {
            if (!val) {
              return true;
            }
            return val.toString().length === 6;
          }
        ),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});
const googleAuth = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup.string().email().required(),
      socialAuthId: yup.string().required(),
      fcmToken: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const facebookAuth = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup.string().email().required(),
      socialAuthId: yup.string().required(),
      fcmToken: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const appleAuth = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      email: yup.string().email().optional(),
      socialAuthId: yup.string().required(),
      fcmToken: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/register": registerRule,
  "/login": loginRule,
  "/logout": logoutRule,
  "/forget-password": forgetPassword,
  "/reset-password": resetPassword,
  "/get-new-token": getAccessTokenRule,
  "/send-otp": resendOtp,
  "/verify-otp": verifyOtp,
  "/update": updateData,
  "/update-detail": updateData,
  "/update-password": updatePassword,
  "/google-auth": googleAuth,
  "/facebook-auth": facebookAuth,
  "/apple-auth": appleAuth,
};
