import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";

import { ETaskUserStatus, TaskType } from "../database/interfaces/enums";

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
};

const showRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup.object().noUnknown(),
});

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

const myTaskRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      type: yup.string().oneOf(["accepted", "created"]).required(),
    })
    .noUnknown(),
});

const createRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      title: yup.string().required(),
      description: yup.string().notRequired(),
      location: yup
        .object()
        .shape({
          coordinates: yup.array().of(yup.string()).length(2).required(),
          readableLocation: yup.string().required(),
        })
        .required(),
      requirement: yup.string().notRequired(),
      date: yup
        .string()
        .matches(
          /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
          "Please enter a valid start date in the format YYYY-MM-DD"
        )
        .required(),
      slot: yup
        .object()
        .shape({
          startTime: yup
            .string()
            .required()
            .matches(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "Invalid start time format. Please use HH:mm format."
            ),
          endTime: yup
            .string()
            .required()
            .matches(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "Invalid end time format. Please use HH:mm format."
            ),
        })
        .required(),
      noOfServiceProvider: yup.string().notRequired(),
      commercial: yup.boolean().notRequired(),
      type: yup
        .string()
        .oneOf([...Object.values(TaskType).map((value) => value?.toString())])
        .notRequired(),
      taskInterests: yup.array().of(yup.string().length(24)).default([]),
      goList: yup.string().length(24).notRequired(),
      goListServiceProviders: yup
        .array()
        .of(yup.string().length(24))
        .notRequired(),
      myList: yup.array().of(yup.string().length(24)).default([]),
      subTasks: yup
        .array()
        .of(
          yup.object().shape({
            title: yup.string().required(),
            noOfServiceProvider: yup.string().notRequired(),
            note: yup.string().notRequired(),
            slot: yup
              .object()
              .shape({
                startTime: yup
                  .string()
                  .notRequired()
                  .matches(
                    /^([01]\d|2[0-3]):[0-5]\d$/,
                    "Invalid start time format. Please use HH:mm format."
                  ),
                endTime: yup
                  .string()
                  .notRequired()
                  .matches(
                    /^([01]\d|2[0-3]):[0-5]\d$/,
                    "Invalid end time format. Please use HH:mm format."
                  ),
              })
              .notRequired(),
          })
        )
        .default([]),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const updateRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      title: yup.string().notRequired(),
      description: yup.string().notRequired(),
      location: yup
        .object()
        .shape({
          coordinates: yup.array().of(yup.string()).length(2),
          readableLocation: yup.string(),
        })
        .notRequired(),
      requirement: yup.string().notRequired(),
      date: yup
        .string()
        .matches(
          /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
          "Please enter a valid start date in the format YYYY-MM-DD"
        )
        .notRequired(),
      slot: yup
        .object()
        .shape({
          startTime: yup
            .string()
            .required()
            .matches(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "Invalid start time format. Please use HH:mm format."
            ),
          endTime: yup
            .string()
            .required()
            .matches(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "Invalid end time format. Please use HH:mm format."
            ),
        })
        .notRequired(),
      noOfServiceProvider: yup.string().notRequired(),
      commercial: yup.boolean().notRequired(),
      type: yup
        .string()
        .oneOf([...Object.values(TaskType).map((value) => value?.toString())])
        .notRequired(),
      taskInterests: yup.array().of(yup.string().length(24)).default([]),
      goList: yup.string().length(24).notRequired(),
      goListServiceProviders: yup
        .array()
        .of(yup.string().length(24))
        .notRequired(),
      myList: yup.array().of(yup.string().length(24)).default([]),
      subTasks: yup
        .array()
        .of(
          yup.object().shape({
            title: yup.string().required(),
            noOfServiceProvider: yup.string().notRequired(),
            note: yup.string().notRequired(),
            slot: yup
              .object()
              .shape({
                startTime: yup
                  .string()
                  .required()
                  .matches(
                    /^([01]\d|2[0-3]):[0-5]\d$/,
                    "Invalid start time format. Please use HH:mm format."
                  ),
                endTime: yup
                  .string()
                  .required()
                  .matches(
                    /^([01]\d|2[0-3]):[0-5]\d$/,
                    "Invalid end time format. Please use HH:mm format."
                  ),
              })
              .notRequired(),
          })
        )
        .default([])
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const toggleRequestRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
  body: yup
    .object()
    .shape({
      user: paramRule.id,
      status: yup
        .number()
        .oneOf([
          ETaskUserStatus.ACCEPTED,
          ETaskUserStatus.REJECTED,
          ETaskUserStatus.STANDBY,
        ])
        .required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/": indexRule,
  "/my-task": myTaskRule,
  "/show": showRule,
  "/create": createRule,
  "/update": updateRule,
  "/delete": showRule,
  "/toggle-request": toggleRequestRule,
  "/request": showRule,
};
