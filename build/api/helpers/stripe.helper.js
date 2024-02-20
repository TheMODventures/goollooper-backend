"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeHelper = void 0;
const stripe_1 = __importDefault(require("stripe"));
const environment_config_1 = require("../../config/environment.config");
const stripe = new stripe_1.default(environment_config_1.STRIPE_SECRET_KEY, {});
class StripeHelper {
    createStripeCustomer(email) {
        return stripe.customers.create({ email });
    }
    createConnect(email, dataset) {
        return stripe.accounts.create({
            email,
            ...dataset,
            type: "custom",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: "manual",
                    },
                },
            },
            business_type: "individual",
            tos_acceptance: { ip: "8.8.8.8", date: Math.floor(Date.now() / 1000) },
            business_profile: {
                url: "goollooper.com",
                mcc: "5734",
            },
        });
    }
    updateConnect(id, dataset) {
        return stripe.accounts.update(id, dataset);
    }
    addCard(customerId, tokenId) {
        return stripe.customers.createSource(customerId, { source: tokenId });
    }
    updateCard(customerId, sourceId, payload) {
        return stripe.customers.updateSource(customerId, sourceId, payload);
    }
    getCustomerCards(id, page = 1, limit = 100) {
        return stripe.customers.listSources(id, {
            object: "card",
            limit,
        });
    }
    createToken(obj) {
        return stripe.tokens.create(obj);
    }
    createPaymentIntent(obj) {
        return stripe.paymentIntents.create(obj);
    }
    confirmPaymentIntent(paymentIntentId) {
        return stripe.paymentIntents.confirm(paymentIntentId);
    }
    stripeCharge(obj) {
        return stripe.charges.create(obj);
    }
    updateCustomer(customerId, obj) {
        return stripe.customers.update(customerId, obj);
    }
    createSubscription(obj) {
        return stripe.subscriptions.create(obj);
    }
    getPlan(planId) {
        return stripe.plans.retrieve(planId);
    }
    stripeWebHook(body, sig) {
        return stripe.webhooks.constructEvent(body, sig, environment_config_1.STRIPE_WEBHOOK_SECRET);
    }
    getStripeCustomer(id) {
        return stripe.customers.retrieve(id);
    }
    getConnect(id) {
        return stripe.accounts.retrieve(id);
    }
    selectDefaultCard(id, cardId) {
        return stripe.customers.update(id, { default_source: cardId });
    }
    addBankAccount(id, params) {
        return stripe.accounts.createExternalAccount(id, params);
    }
    updateBankAccount(sourceId, connectId, params) {
        return stripe.accounts.updateExternalAccount(connectId, sourceId, params);
    }
    deleteSource(sourceId, customerId) {
        return stripe.customers.deleteSource(customerId, sourceId);
    }
    deleteBank(sourceId, connectId) {
        return stripe.accounts.deleteExternalAccount(connectId, sourceId);
    }
    getBankAccounts(id, page = 1, limit = 100) {
        return stripe.accounts.listExternalAccounts(id, {
            object: "bank_account",
            limit,
        });
    }
    getPaymentMethods(id, page = 1, limit = 100) {
        return stripe.customers.listSources(id, {
            // object: "card",
            limit,
        });
    }
    async uploadFile(payload) {
        return stripe.files.create(payload);
    }
    async createPerson(stripeConnectId, payload) {
        return stripe.accounts.createPerson(stripeConnectId, payload);
    }
    async payout(stripeConnectId, payload) {
        const balance = await stripe.balance.retrieve({}, { stripeAccount: stripeConnectId });
        if (balance?.instant_available && payload.method === "instant") {
            return stripe.payouts.create({
                ...payload,
                amount: balance?.instant_available[0].amount,
            }, { stripeAccount: stripeConnectId });
        }
        else if (balance?.available && payload.method === "standard") {
            return stripe.payouts.create({
                ...payload,
                amount: balance?.available[0].amount,
            }, { stripeAccount: stripeConnectId });
        }
        return false;
    }
}
exports.stripeHelper = new StripeHelper();
//# sourceMappingURL=stripe.helper.js.map