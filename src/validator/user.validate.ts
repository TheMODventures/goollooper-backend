import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import {
  Days,
  EUserLocationType,
  EUserRole,
  UserRole,
} from "../database/interfaces/enums";

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
  username: yup.string().notRequired(),
  email: yup.string().notRequired(),
};

const checkUsernameRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      username: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().noUnknown(),
  query: yup
    .object()
    .shape({
      username: yup.string().notRequired(),
      email: yup.string().notRequired(),
      role: yup
        .string()
        .oneOf([...Object.values(EUserRole).map((value) => value?.toString())])
        .notRequired(),
      page: yup.string().required(),
      limit: yup.string().notRequired(),
    })
    .noUnknown(),
});

const showRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
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
      galleryImages: yup.array().notRequired(),
      about: yup.string().notRequired(),
      role: yup
        .string()
        .oneOf([...Object.values(UserRole).map((value) => value?.toString())])
        .notRequired(),
      volunteer: yup.array().notRequired(),
      services: yup.array().notRequired(),
      subscription: yup
        .object()
        .shape({
          subscription: yup.string().required(),
          name: yup.string().required(),
          // plan: yup.string().required(),
        })
        .notRequired(),
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
            zipCode: yup.string().notRequired(),
            county: yup.string().notRequired(),
            isSelected: yup.string(),
            readableLocation: yup.string(),
          })
        )
        .notRequired(),
      taskLocation: yup
        .array()
        .of(
          yup.object().shape({
            type: yup.string().oneOf(["Point"]).default("Point"),
            coordinates: yup.array().of(yup.string()).length(2),
            state: yup.string().notRequired(),
            city: yup.string().notRequired(),
            readableLocation: yup.string(),
          })
        )
        .notRequired(),
      schedule: yup
        .array()
        .of(
          yup.object().shape({
            day: yup
              .string()
              .oneOf([...Object.values(Days).map((value) => value)])
              .required(),
            startTime: yup
              .string()
              .matches(
                /^([01]\d|2[0-3]):[0-5]\d$/,
                "Invalid start time format. Please use HH:mm format."
              )
              .required("Start time is required"),
            endTime: yup
              .string()
              .matches(
                /^([01]\d|2[0-3]):[0-5]\d$/,
                "Invalid end time format. Please use HH:mm format."
              )
              .required("End time is required"),
          })
        )
        .notRequired(),
      // .notRequired(),
      zipCode: yup
        .array()
        .of(
          yup.object().shape({
            code: yup.string(),
            isSelected: yup.string(),
          })
        )
        .notRequired(),
      visualFiles: yup.array().notRequired(),
      company: yup
        .object()
        .shape({
          name: yup.string().min(3).notRequired(),
          website: yup.string().notRequired(),
          affiliation: yup.string().notRequired(),
          publication: yup.string().notRequired(),
        })
        .notRequired(),
      certificateFiles: yup.array().notRequired(),
      licenseFiles: yup.array().notRequired(),
      reference: yup
        .object()
        .shape({
          name: yup.string().min(3),
          contact: yup.string().min(3),
        })
        .notRequired(),
      insuranceFiles: yup.array().notRequired(),
      isContactPermission: yup.boolean().notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updateScheduleRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({
    // day: yup.string().oneOf([...Object.values(Days).map((value) => value)]).notRequired(),
    startTime: yup
      .string()
      .matches(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid start time format. Please use HH:mm format."
      )
      .notRequired(),
    endTime: yup
      .string()
      .matches(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid end time format. Please use HH:mm format."
      )
      .notRequired(),
  }),
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

export = {
  "/": indexRule,
  "/check-username": checkUsernameRule,
  "/index": indexRule,
  "/trash-index": indexRule,
  "/show": showRule,
  "/update": updateRule,
  "/schedule/update": updateScheduleRule,
  "/trash": showRule,
  "/restore": showRule,
  "/update-password": updatePassword,
};
