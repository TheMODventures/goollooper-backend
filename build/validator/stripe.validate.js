"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
const yup = __importStar(require("yup"));
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
    params: yup.object().shape({
        source: yup.string().required(),
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
module.exports = {
    "/add-card": cardRule,
    "/update-card": editCardRule,
    "/payout": payoutRule,
    "/create-top-up": createTopUpRule,
    "/create-payment-intent": createPaymentIntentRule,
    "/confirm-payment": confirmPaymentRule,
    "/apply-for-subscription": applyForSubscriptionRule,
    "/webhook": webhookRule,
};
//# sourceMappingURL=stripe.validate.js.map