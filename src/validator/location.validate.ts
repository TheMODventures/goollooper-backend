import * as yup from "yup";

const indexRule = yup.object().shape({
  params: yup.object().noUnknown(),
  body: yup.object().shape({}).noUnknown(),
  query: yup
    .object()
    .shape({
      page: yup.string().required(),
      limit: yup.string().notRequired(),
      name: yup.string().notRequired(),
      stateId: yup.string().notRequired(),
    })
    .noUnknown(),
});

export = {
  "/states": indexRule,
  "/cities": indexRule,
  "/counties": indexRule,
};
