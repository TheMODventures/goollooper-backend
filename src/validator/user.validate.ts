import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import {
  Days,
  EUserLocationType,
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
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
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
      about: yup.string().notRequired(),
      role: yup
        .string()
        .oneOf([...Object.values(UserRole).map((value) => value?.toString())])
        .notRequired(),
      volunteer: yup
        .array()
        .of(
          yup.object().shape({
            service: yup.string(),
            subService: yup.string(),
          })
        )
        .notRequired(),
      services: yup
        .array()
        .of(
          yup.object().shape({
            service: yup.string().required(),
            subservice: yup.string().required(),
          })
        )
        .notRequired(),
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
      company: yup
        .object()
        .shape({
          name: yup.string().notRequired(),
          website: yup.string(),
          affiliation: yup.string(),
          publication: yup.string(),
        })
        .notRequired(),
      reference: yup
        .object()
        .shape({
          name: yup.string(),
          contact: yup.string(),
        })
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/check-username": checkUsernameRule,
  "/index": indexRule,
  "/trash-index": indexRule,
  "/show": showRule,
  "/update": updateRule,
  "/trash": showRule,
  "/restore": showRule,
  "/delete": showRule,
};
