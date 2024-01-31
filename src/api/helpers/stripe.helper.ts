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

  addBankAccount(
    id: string,
    params: Stripe.CustomerSourceCreateParams
  ): Promise<Stripe.Response<Stripe.CustomerSource>> {
    return stripe.customers.createSource(id, params);
  }

  updateBankAccount(
    sourceId: string,
    customerId: string,
    params: Stripe.CustomerSourceCreateParams
  ): Promise<Stripe.Response<Stripe.CustomerSource>> {
    return stripe.customers.updateSource(customerId, sourceId, params);
  }

  deleteSource(
    sourceId: string,
    customerId: string
  ): Promise<Stripe.CustomerSource | Stripe.DeletedCustomerSource> {
    return stripe.customers.deleteSource(customerId, sourceId);
  }

  getBankAccounts(
    id: string,
    page = 1,
    limit = 100
  ): Stripe.ApiListPromise<Stripe.CustomerSource> {
    return stripe.customers.listSources(id, {
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
