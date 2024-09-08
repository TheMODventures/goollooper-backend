import { Response } from "express";

import * as yup from "yup";

const createRule = yup.object().shape({
  params: yup.object().noUnknown(true),
  body: yup.object().shape({
    idNumber: yup.string().when("countryCode", {
      is: "US",
      then: (schema) => schema.required(),
      otherwise: (schema) => schema,
    }),
    ssnLast4: yup.string().when("countryCode", {
      is: "US",
      then: (schema) => schema.required(),
      otherwise: (schema) => schema,
    }),
    dob: yup.string().required(),
    countryCode: yup.string().required(),
    line1: yup.string().required(),
    line2: yup.string().required(),
    country: yup.string().required(),
    state: yup.string().required(),
    city: yup.string().required(),
    postal_code: yup.string().required(),
    account_number: yup.string().required(),
    routing_number: yup.string().required(),
    account_holder_name: yup.string().required(),
  }),
});

export = {
  "/create": createRule,
};
