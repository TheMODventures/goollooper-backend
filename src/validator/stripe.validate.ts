import * as yup from "yup";

const cardRule = yup.object().shape({
  body: yup.object().shape({
    cardNumber: yup.string().required(),
    expMonth: yup.string().required(),
    expYear: yup.string().required(),
    cvc: yup.string().required(),
  }),
});

const editCardRule = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  body: yup.object().shape({
    expMonth: yup.string().notRequired(),
    expYear: yup.string().notRequired(),
    name: yup.string().notRequired(),
  }),
});

const payoutRule = yup.object().shape({
  params: yup.object().shape({}).unknown(),
  body: yup.object().shape({
    amount: yup.number().required(),
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
      // paymentMethodId: yup.string().required(),
      // type: yup.string().required().oneOf(["top-up", "subscription"]),
    })
    .noUnknown(),
});

const confirmPaymentRule = yup.object().shape({
  body: yup
    .object()
    .shape({
      paymentIntentId: yup.string().required("Payment intent id is required"),
      paymentMethod: yup.string().required("Payment method is required"),
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

const withdrawRequest = yup.object().shape({
  body: yup.object().shape({
    amount: yup.number().required(),
  }),
});

export = {
  "/add-card": cardRule,
  "/update-card": editCardRule,
  "/payout": payoutRule,
  "/create-top-up": createTopUpRule,
  "/create-payment-intent": createPaymentIntentRule,
  "/confirm-payment": confirmPaymentRule,
  "/apply-for-subscription": applyForSubscriptionRule,
  "/webhook": webhookRule,
  "/withdraw-request": withdrawRequest,
};
