import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const createRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      name: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().shape({}).noUnknown(),
});

const deleteRule = yup.object().shape({
  params: yup.object().shape(paramRule).unknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().shape({}).noUnknown(),
});

export = {
  "/create": createRule,
  "/delete": deleteRule,
};
