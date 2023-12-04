import { isObjectIdOrHexString } from "mongoose";
import * as yup from "yup";
import { EUserLocationType, EUserRole } from "../database/interfaces/enums";

const paramRule = {
  id: yup
    .string()
    .required()
    .test("invalid id", "No Such Id Exist", (value: string) => {
      return isObjectIdOrHexString(value);
    }),
  username: yup.string().notRequired(),
  email: yup.string().notRequired(),
};

const checkUsernameRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup
    .object()
    .shape({
      username: yup.string().required(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

const indexRule = yup.object().shape({
  params: yup.object().shape(paramRule).noUnknown(),
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
      lastName: yup.string().notRequired(),
      username: yup.string().min(3).max(20).required(),
      gender: yup.string().required(),
      age: yup.string().notRequired(),
      countryCode: yup.string().notRequired(),
      phoneCode: yup.string().notRequired(),
      phone: yup.string().notRequired(),
      profileImage: yup
        .array()
        .max(1)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["profileImage"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
      gallery: yup
        .array()
        .max(5)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["gallery"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
          // yup.object().shape({
          //   name: yup.string().required(),
          //   image: yup
          //     .mixed<Express.Multer.File>()
          //     .required("Image is required")
          //     .test(
          //       "fileSize",
          //       "File size is too large",
          //       (value) => !value || (value && value.size <= 5 * 1024 * 1024) // 5 MB limit
          //     )
          //     .test(
          //       "fileType",
          //       "Invalid file type. Only images are allowed",
          //       (value) =>
          //         !value || (value && value.mimetype.startsWith("image/"))
          //     ),
          // })
        )
        .notRequired(),
      about: yup.string().notRequired(),
      role: yup
        .number()
        .oneOf([...Object.values(EUserRole).map((value) => Number(value))])
        .notRequired(),
      volunteer: yup
        .array()
        .of(
          yup.object().shape({
            service: yup.string(),
            subService: yup.string(),
          })
        )
        .notRequired(),
      services: yup
        .array()
        .of(
          yup.object().shape({
            service: yup.string().required(),
            subservice: yup.string().required(),
          })
        )
        .notRequired(),
      subscription: yup
        .object()
        .shape({
          subscription: yup.string().required(),
          plan: yup.string().required(),
        })
        .notRequired(),
      locationType: yup
        .string()
        .oneOf([...Object.values(EUserLocationType).map((value) => value)])
        .default(EUserLocationType.global),
      location: yup
        .array()
        .of(
          yup.object().shape({
            type: yup.string().oneOf(["Point"]).default("Point"),
            coordinates: yup.array().of(yup.string()).length(2),
            state: yup.string().notRequired(),
            city: yup.string().notRequired(),
            county: yup.string().notRequired(),
            isSelected: yup.string(),
          })
        )
        .notRequired(),
      zipCode: yup
        .array()
        .of(
          yup.object().shape({
            code: yup.string(),
            isSelected: yup.string(),
          })
        )
        .notRequired(),
      visuals: yup
        .array()
        .max(5)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["visuals"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
      company: yup
        .object()
        .shape({
          name: yup.string().notRequired(),
          website: yup.string(),
          affiliation: yup.string(),
          publication: yup.string(),
        })
        .notRequired(),
      companyLogo: yup
        .array()
        .max(1)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["logo"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
      companyResume: yup
        .array()
        .max(1)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["resume"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
      certificates: yup
        .array()
        .max(5)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["certificates"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
      licenses: yup
        .array()
        .max(5)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["licenses"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
      reference: yup
        .object()
        .shape({
          name: yup.string(),
          contact: yup.string(),
        })
        .notRequired(),
      insurances: yup
        .array()
        .max(5)
        .of(
          yup.object().shape({
            fieldname: yup.string().required().oneOf(["insurances"]),
            originalname: yup.string().required(),
            mimetype: yup.string().required(),
            encoding: yup.string().required(),
            size: yup.number().required(),
          })
        )
        .notRequired(),
    })
    .noUnknown(),
  query: yup.object().noUnknown(),
});

export = {
  "/check-username": checkUsernameRule,
  "/index": indexRule,
  "/trash-index": indexRule,
  "/show": showRule,
  "/update": updateRule,
  "/trash": showRule,
  "/restore": showRule,
  "/delete": showRule,
};
