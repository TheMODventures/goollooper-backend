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
  body: yup.object().shape({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    profileImage: yup.string().required(),
  }),
});

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().noUnknown(),
});

const updateRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({
    firstName: yup.string().notRequired(),
    lastName: yup.string().notRequired(),
    profileImage: yup.string().notRequired(),
  }),
});

const deleteRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/": indexRule,
  "/create": createRule,
  "/update": updateRule,
  "/delete": deleteRule,
};
