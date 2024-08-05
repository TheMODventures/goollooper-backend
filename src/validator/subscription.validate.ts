import * as yup from "yup";
import { SubscriptionType } from "../database/interfaces/enums";
const paramRule = {
  id: yup.string().required(),
};

const createRule = yup.object().shape({
  params: yup.object().strict().noUnknown(),
  body: yup
    .object()
    .shape({
      name: yup.string().required(),
      plan: yup.string().required().oneOf(Object.values(SubscriptionType)), // Assuming SubscriptionType is an enum or similar object
      subscription: yup.string().required(),
      priceId: yup.string().required(),
      price: yup.number().required(),
    })
    .strict()
    .noUnknown(),
  query: yup.object().strict().noUnknown(),
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
    })
    .noUnknown(),
});

const showRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/": indexRule,
  "/create": createRule,
  "/show": showRule,
};
