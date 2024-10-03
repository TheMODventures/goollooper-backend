import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import { ServiceType } from "../database/interfaces/enums";

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
      title: yup.string().required("Title is required."),
      type: yup
        .string()
        .required("Type is required.")
        .oneOf(Object.values(ServiceType), "Invalid service type."), // Ensure type is a valid enum value
      parent: yup.string().nullable(),
      industry: yup
        .string()
        .nullable()
        .when("type", {
          is: ServiceType.interest,
          then: (schema) =>
            schema.required("Industry is required for interest type."),
          otherwise: (schema) => schema.notRequired(),
        }),
      keyWords: yup
        .array()
        .of(yup.string().required("Keyword must be a string."))
        .notRequired(),
      subCategories: yup.array(),
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
      search: yup.string().notRequired(),
      parent: yup.string().notRequired(),
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
      parent: yup.string().notRequired(),
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

const deleteSubServiceRule = yup.object().shape({
  params: yup.object().shape(subServiceUpdateParamRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
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
  "/sub-service/delete": deleteSubServiceRule,
};
