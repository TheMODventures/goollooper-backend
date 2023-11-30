import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import { SubscriptionType } from "../database/interfaces/enums";

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const PlanParamRule = {
  subscriptionId: yup
    .string()
    .required()
    .test("invalid subscriptionId", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const PlanUpdateParamRule = {
  subscriptionId: yup
    .string()
    .required()
    .test(
      "invalid subscriptionId",
      "No Such subscriptionId Exist",
      (value: string) => {
        return isObjectIdOrHexString(value);
      }
    ),
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
      name: yup.string().required(),
      tagline: yup.string().required(),
      description: yup.string().required(),
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
      name: yup.string().notRequired(),
      tagline: yup.string().notRequired(),
      description: yup.string().notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

// sub-services
const createPlanRule = yup.object().shape({
  params: yup.object(PlanParamRule).noUnknown(),
  body: yup
    .object()
    .shape({
      price: yup.number().required(),
      duration: yup
        .string()
        .oneOf([...Object.values(SubscriptionType).map((value) => value)])
        .required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updatePlanRule = yup.object().shape({
  params: yup.object().shape(PlanUpdateParamRule).noUnknown(),
  body: yup
    .object()
    .shape({
      price: yup.number().notRequired(),
      duration: yup
        .string()
        .oneOf([...Object.values(SubscriptionType).map((value) => value)])
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const deletePlanRule = yup.object().shape({
  params: yup.object().shape(PlanUpdateParamRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/": indexRule,
  "/create": createRule,
  "/update": updateRule,
  "/show": showRule,
  "/delete": showRule,
  "/subscription-plan/create": createPlanRule,
  "/subscription-plan/update": updatePlanRule,
  "/subscription-plan/delete": deletePlanRule,
};
