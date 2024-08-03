import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

import { Request, RequestStatus } from "../database/interfaces/enums";

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const updateRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      title: yup.string().notRequired(),
      amount: yup.string().notRequired(),
      type: yup
        .string()
        .oneOf([...Object.values(Request).map((value) => value?.toString())])
        .required(),
      status: yup
        .string()
        .oneOf([
          ...Object.values(RequestStatus).map((value) => value?.toString()),
        ])
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updateCallTokenRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      callToken: yup.string().required(),
      callDeviceType: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const chatDetailsRule = yup.object().shape({
  query: yup.object().shape({
    chatId: yup.string().required(),
    userId: yup.string().required(),
  }),
});

export = {
  "/request": updateRule,
  "/call/token": updateCallTokenRule,
  "/details": chatDetailsRule,
};
