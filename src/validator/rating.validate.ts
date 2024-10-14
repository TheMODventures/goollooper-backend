import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

const indexRule = yup.object().shape({
  params: yup
    .object()
    .shape({
      user: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
    })
    .noUnknown(),
});

const createRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      to: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
      by: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
      task: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
      star: yup.number().min(1).max(5).required(),
      description: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const createMultipleRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      to: yup
        .array()
        .of(
          yup
            .string()
            .required()
            .test("invalid id", "No Such Id Exist", (value: string) => {
              return isObjectIdOrHexString(value);
            })
        )
        .min(1)
        .required(),
      by: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
      task: yup
        .string()
        .required()
        .test("invalid id", "No Such Id Exist", (value: string) => {
          return isObjectIdOrHexString(value);
        }),
      star: yup.number().min(1).max(5).required(),
      description: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});
// const isRatingExistRule = yup.object().shape({
//   params: yup.object().noUnknown(),
//   body:yup.object(),
//   query: yup.object().noUnknown(),
// })
export = {
  "/": indexRule,
  "/create": createRule,
  "/multiple": createMultipleRule,
  // "isRatingExist":
};
