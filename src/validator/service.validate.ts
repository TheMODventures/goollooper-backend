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

const subServiceParamRule = {
  serviceId: yup
    .string()
    .required()
    .test("invalid serviceId", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const subServiceUpdateParamRule = {
  serviceId: yup
    .string()
    .required()
    .test("invalid serviceId", "No Such serviceId Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
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
      title: yup.string().required(),
      type: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

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
      title: yup.string().notRequired(),
      type: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

// sub-services
const createSubServiceRule = yup.object().shape({
  params: yup.object(subServiceParamRule).noUnknown(),
  body: yup
    .object()
    .shape({
      title: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updateSubServiceRule = yup.object().shape({
  params: yup.object().shape(subServiceUpdateParamRule).noUnknown(),
  body: yup
    .object()
    .shape({
      title: yup.string().notRequired(),
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
  "/sub-service/create": createSubServiceRule,
  "/sub-service/update": updateSubServiceRule,
};
