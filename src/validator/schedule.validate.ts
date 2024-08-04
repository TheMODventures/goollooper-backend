import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

import { Days } from "../database/interfaces/enums";

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
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      title: yup.string().notRequired(),
      type: yup.string().notRequired(),
    })
    .noUnknown(),
});

const createRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      day: yup
        .string()
        .oneOf([...Object.values(Days).map((value) => value?.toString())])
        .required(),
      startTime: yup
        .string()
        .required()
        .matches(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          "Invalid start time format. Please use HH:mm format."
        ),
      endTime: yup
        .string()
        .required()
        .matches(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          "Invalid end time format. Please use HH:mm format."
        ),
      dayOff: yup.boolean().notRequired().default(false),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
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
      day: yup
        .string()
        .oneOf([...Object.values(Days).map((value) => value?.toString())])
        .notRequired(),
      startTime: yup
        .string()
        .notRequired()
        .matches(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          "Invalid start time format. Please use HH:mm format."
        ),
      endTime: yup
        .string()
        .notRequired()
        .matches(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          "Invalid end time format. Please use HH:mm format."
        ),
      dayOff: yup.boolean().notRequired().default(false),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/": indexRule,
  "/create": createRule,
  "/update": updateRule,
  "/show": showRule,
  "/delete": showRule,
};
