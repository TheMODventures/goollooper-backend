import { isObjectIdOrHexString } from "mongoose";
import phone from "phone";
import * as yup from "yup";

const paramRule = {
  _id: yup
    .string()
    .required()
    .test("invalid_id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
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
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      isBanned: yup.bool().notRequired().nullable(),
      emailAlert: yup.bool().notRequired().nullable(),
      inAppNotification: yup.bool().notRequired().nullable(),
      phoneNumber: yup
        .string()
        .nullable()
        .notRequired()
        .test(
          "invalid_number",
          "No such Phone Number exists!",
          (value: string | undefined | null) => {
            if (typeof value !== "string" || value === "") {
              return true;
            }
            return phone(value!, { validateMobilePrefix: true }).isValid;
          }
        ),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/index": indexRule,
  "/trash-index": indexRule,
  "/show": showRule,
  "/update": updateRule,
  "/trash": showRule,
  "/restore": showRule,
  "/delete": showRule,
};
