import * as yup from "yup";

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      date: yup
        .string()
        .matches(
          /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
          "Please enter a valid start date in the format YYYY-MM-DD"
        )
        .notRequired(),
    })
    .noUnknown(),
});

export = {
  "/": indexRule,
};
