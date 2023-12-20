import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import UserService from "../api/services/user.service";
import { EList } from "../database/interfaces/enums";
const userService = new UserService();
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
      title: yup.string().required(),
      serviceProviders: yup
        .array()
        .min(1)
        .of(
          paramRule.id.test(
            "not exist",
            "user not exist",
            async (value: string) => {
              return (await userService.show(value)).status;
            }
          )
        )
        .required(),
      type: yup
        .number()
        .oneOf([...Object.values(EList).map((value) => Number(value))])
        .required(),
      taskInterests: yup.array().of(paramRule.id).notRequired(),
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
      name: yup.string().notRequired(),
      title: yup.string().notRequired(),
      type: yup
        .string()
        .oneOf([...Object.values(EList).map((value) => value.toString())])
        .notRequired(),
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
      serviceProviders: yup
        .array()
        .of(
          paramRule.id.test(
            "not exist",
            "user not exist",
            async (value: string) => {
              return (await userService.show(value)).status;
            }
          )
        )
        .required(),
      taskInterests: yup.array().of(paramRule.id).notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});
const getNearestServiceProvidersRule = yup.object().shape({
  params: yup.object().shape({}).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      zipCode: yup.string(),
      latitude: yup.string(),
      longitude: yup.string(),
      taskInterests: yup.array().of(paramRule.id).notRequired(),
      subscription: yup.string().notRequired(),
    })
    .test(
      "zipCodeOrCoordinates",
      "Either zipCode or both latitude and longitude are required",
      function (value) {
        const { zipCode, latitude, longitude } = value;

        if (zipCode && (latitude || longitude)) {
          return this.createError({
            message:
              "Either zipCode or both latitude and longitude are required",
            path: "zipCode",
          });
        }

        return true;
      }
    )
    .noUnknown(),
});
export = {
  "/": indexRule,
  "/create": createRule,
  "/update": updateRule,
  "/show": showRule,
  "/delete": showRule,
  "/nearest-service-provider": getNearestServiceProvidersRule,
};