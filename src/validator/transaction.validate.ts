import * as yup from "yup";
import { isObjectIdOrHexString } from "mongoose";

import { TransactionType } from "../database/interfaces/enums";

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
        .oneOf([
          ...Object.values(TransactionType).map((value) => value?.toString()),
        ])
        .notRequired(),
      status: yup.string().notRequired(),
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      user: yup.string().notRequired(),
    })
    .noUnknown(),
});

const createRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      user: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
      amount: yup.number().required(),
      type: yup
        .string()
        .oneOf([
          ...Object.values(TransactionType).map((value) => value?.toString()),
        ])
        .required(),
      task: yup.string().notRequired(),
      subscription: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().shape({}).noUnknown(),
});

const updateRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      user: yup.string().notRequired(),
      amount: yup.number().notRequired(),
      type: yup
        .string()
        .oneOf([
          ...Object.values(TransactionType).map((value) => value?.toString()),
        ])
        .notRequired(),
      task: yup.string().notRequired(),
      subscription: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().shape({}).noUnknown(),
});

export = {
  "/": indexRule,
  "/create": createRule,
  "/update": updateRule,
};
