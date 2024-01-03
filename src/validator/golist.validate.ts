import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

import UserService from "../api/services/user.service";
import { ELiability, EList, ERating } from "../database/interfaces/enums";

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
      phoneContacts: yup.array().when(["type"], {
        is: (type: number) => type == EList.myList,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.nullable(),
      }),
      serviceProviders: yup
        .array()
        .min(1)
        .when(["type"], {
          is: (type: number) => type == EList.goList,
          then: (schema) => schema.required(),
          otherwise: (schema) => schema.nullable(),
        })
        .of(
          paramRule.id.test(
            "not exist",
            "user not exist",
            async (value: string) => {
              return true;
              return (await userService.show(value)).status;
            }
          )
        ),
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

const shareRule = yup.object().shape({
  params: yup.object().shape({}).noUnknown(),
  body: yup
    .object()
    .shape({
      serviceProviderId: paramRule.id,
      myList: yup
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
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const checkPostalCodeRule = yup.object().shape({
  params: yup.object().shape({}).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().shape({
    zipCode: yup.string().required(),
  }),
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
      rating: yup
        .string()
        .oneOf([...Object.values(ERating).map((value) => value.toString())]),
      taskInterests: yup.array().of(paramRule.id).notRequired(),
      subscription: yup.string().notRequired(),
      companyLogo: yup.boolean().notRequired(),
      companyRegistration: yup.boolean().notRequired(),
      companyWebsite: yup.boolean().notRequired(),
      companyAffilation: yup.boolean().notRequired(),
      companyPublication: yup.boolean().notRequired(),
      companyResume: yup.boolean().notRequired(),
      certificate: yup
        .string()
        .oneOf([...Object.values(ELiability).map((value) => value.toString())]),
      license: yup
        .string()
        .oneOf([...Object.values(ELiability).map((value) => value.toString())]),
      reference: yup
        .string()
        .oneOf([...Object.values(ELiability).map((value) => value.toString())]),
      insurance: yup
        .string()
        .oneOf([...Object.values(ELiability).map((value) => value.toString())]),
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
  "/zip-code": checkPostalCodeRule,
  "/nearest-service-provider": getNearestServiceProvidersRule,
  "/share": shareRule,
};
