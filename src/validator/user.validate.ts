import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import {
  Days,
  EUserLocationType,
  EUserRole,
  Repetition,
  RepetitionEvery,
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
          plan: yup.string().required(),
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
      schedule: yup
        .object()
        .shape({
          startDate: yup
            .string()
            .matches(
              /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
              "Please enter a valid start date in the format YYYY-MM-DD"
            )
            .required("Start Date is required"),
          endDate: yup
            .string()
            .matches(
              /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
              "Please enter a valid end date in the format YYYY-MM-DD"
            )
            .notRequired(),
          slots: yup
            .array()
            .min(1)
            .of(
              yup.object().shape({
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
            .required(),
          repetition: yup
            .string()
            .oneOf([
              ...Object.values(Repetition).map((value) => value?.toString()),
            ])
            .required(),
          repeatsAfter: yup.string().notRequired(),
          repeatsEvery: yup
            .string()
            .oneOf([
              ...Object.values(RepetitionEvery).map((value) =>
                value?.toString()
              ),
            ])
            .notRequired(),
          repeatsOn: yup
            .array()
            .of(
              yup
                .string()
                .oneOf([
                  ...Object.values(Days).map((value) => value?.toString()),
                ])
            )
            .notRequired(),
          occurrence: yup.string().notRequired(),
        })
        .notRequired(),
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
    date: yup
      .string()
      .matches(
        /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
        "Please enter a valid start date in the format YYYY-MM-DD"
      )
      .required(),
    slots: yup
      .array()
      .of(
        yup.object().shape({
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
