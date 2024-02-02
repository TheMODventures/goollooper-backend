import Stripe from "stripe";
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} from "../../config/environment.config";

const stripe = new Stripe(STRIPE_SECRET_KEY as string, {});

class StripeHelper {
  createStripeCustomer(email: string): Promise<Stripe.Customer> {
    return stripe.customers.create({ email });
  }

  createConnect(
    email: string,
    dataset: Stripe.AccountCreateParams
  ): Promise<Stripe.Account> {
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

  updateConnect(
    id: string,
    dataset: Stripe.AccountUpdateParams
  ): Promise<Stripe.Account> {
    return stripe.accounts.update(id, dataset);
  }

  addCard(customerId: string, tokenId: string): Promise<Stripe.CustomerSource> {
    return stripe.customers.createSource(customerId, { source: tokenId });
  }

  getCustomerCards(
    id: string,
    page = 1,
    limit = 100
  ): Stripe.ApiListPromise<Stripe.CustomerSource> {
    return stripe.customers.listSources(id, {
      object: "card",
      limit,
    });
  }

  createToken(obj: Stripe.TokenCreateParams): Promise<Stripe.Token> {
    return stripe.tokens.create(obj);
  }

  createPaymentIntent(
    obj: Stripe.PaymentIntentCreateParams
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create(obj);
  }

  confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.confirm(paymentIntentId);
  }

  stripeCharge(obj: Stripe.ChargeCreateParams): Promise<Stripe.Charge> {
    return stripe.charges.create(obj);
  }

  updateCustomer(
    customerId: string,
    obj: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    return stripe.customers.update(customerId, obj);
  }

  createSubscription(
    obj: Stripe.SubscriptionCreateParams
  ): Promise<Stripe.Subscription> {
    return stripe.subscriptions.create(obj);
  }

  getPlan(planId: string): Promise<Stripe.Plan> {
    return stripe.plans.retrieve(planId);
  }

  stripeWebHook(body: string, sig: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      sig,
      STRIPE_WEBHOOK_SECRET as string
    );
  }

  getStripeCustomer(
    id: string
  ): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>> {
    return stripe.customers.retrieve(id);
  }

  getConnect(
    id: string
  ): Promise<Stripe.Response<Stripe.Account | Stripe.DeletedAccount>> {
    return stripe.accounts.retrieve(id);
  }

  selectDefaultCard(
    id: string,
    cardId: string
  ): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>> {
    return stripe.customers.update(id, { default_source: cardId });
  }

  addBankAccount(
    id: string,
    params: Stripe.ExternalAccountCreateParams
  ): Promise<Stripe.Response<Stripe.ExternalAccount>> {
    return stripe.accounts.createExternalAccount(id, params);
  }

  updateBankAccount(
    sourceId: string,
    connectId: string,
    params: Stripe.ExternalAccountUpdateParams
  ): Promise<Stripe.Response<Stripe.ExternalAccount>> {
    return stripe.accounts.updateExternalAccount(connectId, sourceId, params);
  }

  deleteSource(
    sourceId: string,
    customerId: string
  ): Promise<Stripe.CustomerSource | Stripe.DeletedCustomerSource> {
    return stripe.customers.deleteSource(customerId, sourceId);
  }

  deleteBank(
    sourceId: string,
    connectId: string
  ): Promise<Stripe.CustomerSource | Stripe.DeletedCustomerSource> {
    return stripe.accounts.deleteExternalAccount(connectId, sourceId);
  }

  getBankAccounts(
    id: string,
    page = 1,
    limit = 100
  ): Stripe.ApiListPromise<Stripe.CustomerSource> {
    return stripe.accounts.listExternalAccounts(id, {
      object: "bank_account",
      limit,
    });
  }

  getPaymentMethods(
    id: string,
    page = 1,
    limit = 100
  ): Stripe.ApiListPromise<Stripe.CustomerSource> {
    return stripe.customers.listSources(id, {
      // object: "card",
      limit,
    });
  }
}

export const stripeHelper = new StripeHelper();
