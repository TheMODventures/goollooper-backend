import { Response } from "express";

import * as yup from "yup";

export const fieldValidationSchemas: Record<string, yup.Schema<any>> = {
  profileImage: yup
    .array()
    .max(1)
    .of(
      yup.object().shape({
        fieldname: yup.string().required().oneOf(["profileImage"]),
        originalname: yup.string().required(),
        mimetype: yup
          .string()
          .required()
          .test({
            name: "mimetype",
            message:
              "Invalid file type of Profile Image. Only jpg or png allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" || value === "image/jpeg"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          .test({
            name: "size",
            message: "Profile Image size should be less than 10 MB",
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
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
        mimetype: yup
          .string()
          .required()
          //   .oneOf(["image/png", "image/gif"])
          .test({
            name: "mimetype",
            message: "Invalid file type of gallery. Only jpg or png allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" || value === "image/jpeg"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          //   .max(1024 * 1024 * 10.1) // 10 MB limit
          .test({
            name: "size",
            message: "gallery size should be less than 10 MB", // size must be less than or equal to 10
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
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
        mimetype: yup
          .string()
          .required()
          .test({
            name: "mimetype",
            message:
              "Invalid file type of visuals. Only jpg, png or video allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" ||
                value === "image/jpeg" ||
                value.startsWith("video/")),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          .test({
            name: "size",
            message: "visuals size should be less than 50 MB",
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 100.1,
          }),
      })
    )
    .notRequired(),
  companyLogo: yup
    .array()
    .max(1)
    .of(
      yup.object().shape({
        fieldname: yup.string().required().oneOf(["companyLogo"]),
        originalname: yup.string().required(),
        mimetype: yup
          .string()
          .required()
          //   .oneOf(["image/png", "image/gif"])
          .test({
            name: "mimetype",
            message: "Invalid file type company logo. Only jpg or png allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" || value === "image/jpeg"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          //   .max(1024 * 1024 * 10.1) // 10 MB limit
          .test({
            name: "size",
            message: "company logo size should be less than 10 MB", // size must be less than or equal to 10
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
      })
    )
    .notRequired(),
  companyResume: yup
    .array()
    .max(1)
    .of(
      yup.object().shape({
        fieldname: yup.string().required().oneOf(["companyResume"]),
        originalname: yup.string().required(),
        mimetype: yup
          .string()
          .required()
          .test({
            name: "mimetype",
            message:
              "Invalid file type of company resume. Only jpg, png or pdf allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" ||
                value === "image/jpeg" ||
                value === "application/pdf"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          .test({
            name: "size",
            message: "company resume size should be less than 10 MB",
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
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
        mimetype: yup
          .string()
          .required()
          .test({
            name: "mimetype",
            message:
              "Invalid file type of certificates. Only jpg, png, or pdf allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" ||
                value === "image/jpeg" ||
                value === "application/pdf"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          .test({
            name: "size",
            message: "certificates size should be less than 10 MB",
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
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
        mimetype: yup
          .string()
          .required()
          .test({
            name: "mimetype",
            message:
              "Invalid file type of licenses. Only jpg, png, or pdf allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" ||
                value === "image/jpeg" ||
                value === "application/pdf"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          .test({
            name: "size",
            message: "licenses size should be less than 10 MB",
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
      })
    )
    .notRequired(),
  insurances: yup
    .array()
    .max(5)
    .of(
      yup.object().shape({
        fieldname: yup.string().required().oneOf(["insurances"]),
        originalname: yup.string().required(),
        mimetype: yup
          .string()
          .required()
          .test({
            name: "mimetype",
            message:
              "Invalid file type of insurances. Only jpg, png, or pdf allowed",
            test: (value) =>
              typeof value === "string" &&
              (value === "image/png" ||
                value === "image/jpeg" ||
                value === "application/pdf"),
          }),
        encoding: yup.string().required(),
        size: yup
          .number()
          .required()
          .test({
            name: "size",
            message: "insurances size should be less than 10 MB",
            test: (value) =>
              typeof value === "number" && value <= 1024 * 1024 * 10.1,
          }),
      })
    )
    .notRequired(),
};

export const validateFiles = (
  files: Express.Multer.File[] | undefined,
  field: string,
  res: Response
): void => {
  try {
    const validationSchema = fieldValidationSchemas[field];
    if (validationSchema) {
      const typedFiles: Express.Multer.File[] = files as Express.Multer.File[];

      validationSchema.validateSync(typedFiles, { abortEarly: false });
    }
  } catch (error) {
    // Validation failed
    if (error instanceof yup.ValidationError) {
      const customErrors = error.inner.map((e) => {
        if (e.path === field) {
          if (e.path.includes("size")) {
            const sizeLimit = (e.params as { max: number }).max / (1024 * 1024); // convert bytes to MB
            return `${field} size should be less than ${sizeLimit} MB`;
          }
          return `${field}: ${e.message}`;
        }
        return e.message;
      });

      res.status(400).json({ error: customErrors });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
