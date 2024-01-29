import * as yup from "yup";

const cardRule = yup.object().shape({
  body: yup.object().shape({
    cardNumber: yup.string().required(),
    expMonth: yup.string().required(),
    expYear: yup.string().required(),
    cvc: yup.string().required(),
  }),
});

const createTopUpRule = yup.object().shape({
  body: yup
    .object()
    .shape({
      amount: yup.number().required(),
      source: yup.string().required(),
      currency: yup.string().required(),
      description: yup.string().required(),
    })
    .noUnknown(),
});

const createPaymentIntentRule = yup.object().shape({
  body: yup
    .object()
    .shape({
      amount: yup.number().required(),
    })
    .noUnknown(),
});

const confirmPaymentRule = yup.object().shape({
  body: yup
    .object()
    .shape({
      paymentIntentId: yup.string().required(),
    })
    .noUnknown(),
});

const applyForSubscriptionRule = yup.object().shape({
  body: yup
    .object()
    .shape({
      subscriptionId: yup.string().required(),
    })
    .noUnknown(),
});

const webhookRule = yup.object().shape({
  body: yup.object().noUnknown(),
  headers: yup.object().shape({
    "stripe-signature": yup.string().required(),
  }),
});

export = {
  "/add-card": cardRule,
  "/create-top-up": createTopUpRule,
  "/create-payment-intent": createPaymentIntentRule,
  "/confirm-payment": confirmPaymentRule,
  "/apply-for-subscription": applyForSubscriptionRule,
  "/webhook": webhookRule,
};
