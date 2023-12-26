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

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      taskInterests: yup.array().of(paramRule.id).notRequired(),
    })
    .noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      name: yup.string().notRequired(),
    })
    .noUnknown(),
});

export = {
  "/": indexRule,
};
