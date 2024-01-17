import * as yup from "yup";
import { EGUIDELINE } from "../database/interfaces/enums";
import { isObjectIdOrHexString } from "mongoose";

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
      type: yup
        .string()
        .oneOf(Object.values(EGUIDELINE).map((e) => e.toString()))
        .notRequired(),
    })
    .noUnknown(),
});

const createRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      content: yup.string().notRequired(),
      type: yup
        .number()
        .oneOf(Object.values(EGUIDELINE).map((e) => Number(e)))
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().shape({}).noUnknown(),
});

const updateRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      content: yup.string().notRequired(),
      type: yup
        .number()
        .oneOf(Object.values(EGUIDELINE).map((e) => Number(e)))
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().shape({}).noUnknown(),
});

export = {
  "/": indexRule,
  "/create": createRule,
  "/update": updateRule,
};
