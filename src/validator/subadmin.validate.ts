import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

import { EUserLocationType, EUserRole } from "../database/interfaces/enums";
import AuthService from "../api/services/auth.service";

const authData = new AuthService();

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      username: yup.string().notRequired(),
      email: yup.string().notRequired(),
      role: yup
        .string()
        .oneOf(
          [`${EUserRole.subAdmin}`, `${EUserRole.support}`],
          "Role must be either 4 or 5"
        ) // Expecting role as string values
        .notRequired(),
    })
    .noUnknown(),
});

const showRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().noUnknown(),
});

const createRule = yup.object().shape({
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
      firstName: yup.string().notRequired(),
      lastName: yup.string().notRequired(),
      username: yup.string().min(3).max(20).notRequired(),
      gender: yup.string().notRequired(),
      age: yup.string().notRequired(),
      countryCode: yup.string().notRequired(),
      phoneCode: yup.string().notRequired(),
      phone: yup.string().notRequired(),
      role: yup.number().required(),
      locationType: yup
        .string()
        .oneOf([...Object.values(EUserLocationType).map((value) => value)])
        .default(EUserLocationType.global),
      location: yup
        .array()
        .of(
          yup.object().shape({
            type: yup.string().oneOf(["Point"]).default("Point"),
            coordinates: yup.array().of(yup.string()).length(2),
            state: yup.string().notRequired(),
            city: yup.string().notRequired(),
            county: yup.string().notRequired(),
            isSelected: yup.string(),
            readableLocation: yup.string(),
          })
        )
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updateRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      firstName: yup.string().notRequired(),
      lastName: yup.string().notRequired(),
      username: yup.string().min(3).max(20).notRequired(),
      gender: yup.string().notRequired(),
      age: yup.string().notRequired(),
      countryCode: yup.string().notRequired(),
      phoneCode: yup.string().notRequired(),
      phone: yup.string().notRequired(),
      locationType: yup
        .string()
        .oneOf([...Object.values(EUserLocationType).map((value) => value)])
        .default(EUserLocationType.global),
      location: yup
        .array()
        .of(
          yup.object().shape({
            type: yup.string().oneOf(["Point"]).default("Point"),
            coordinates: yup.array().of(yup.string()).length(2),
            state: yup.string().notRequired(),
            city: yup.string().notRequired(),
            county: yup.string().notRequired(),
            isSelected: yup.string(),
            readableLocation: yup.string(),
          })
        )
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/": indexRule,
  "/show": showRule,
  "/create": createRule,
  "/update": updateRule,
  "/delete": showRule,
};
