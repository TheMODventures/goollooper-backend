import Stripe from "stripe";
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_WEBHOOK_CONNECT_ACCOUNT_SECRET,
} from "../../config/environment.config";

const stripe = new Stripe(STRIPE_SECRET_KEY as string, {});
const stripePk = new Stripe(process.env.STRIPE_PUBLISHABLE_KEY as string, {});
class StripeHelper {
  createStripeCustomer(email?: string): Promise<Stripe.Customer> {
    return stripe.customers.create({ email });
  }
  // const timestamp = Math.floor(Date.now() / 1000);
  createConnect(
    email: string,
    dataset: Stripe.AccountCreateParams
  ): Promise<Stripe.Account> {
    return stripe.accounts.create({
      email,
      tos_acceptance: {
        ip: dataset.tos_acceptance?.ip,
        date: Math.floor(Date.now() / 1000),
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

  updateCard(
    customerId: string,
    sourceId: string,
    payload: Stripe.CustomerSourceUpdateParams
  ): Promise<Stripe.CustomerSource> {
    return stripe.customers.updateSource(customerId, sourceId, payload);
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
    return stripePk.tokens.create(obj);
  }

  getDefaultBankAccount(
    connectId: string,
    type: string,
    limit = 1
  ): Stripe.ApiListPromise<Stripe.ExternalAccount> {
    return stripe.accounts.listExternalAccounts(connectId, {
      limit: 1,
    });
  }

  createPaymentIntent(
    obj: Stripe.PaymentIntentCreateParams
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create(obj);
  }

  confirmPaymentIntent(
    paymentIntentId: string,
    paymentDetails: Stripe.PaymentIntentConfirmParams
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.confirm(paymentIntentId, paymentDetails);
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

  stripeWebHookSubscription(body: string, sig: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      sig,
      STRIPE_WEBHOOK_SECRET as string
    );
  }
  stripeWebHookConnectAccount(body: string, sig: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      sig,
      STRIPE_WEBHOOK_CONNECT_ACCOUNT_SECRET as string
    );
  }

  getStripeCustomer(
    id: string
  ): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>> {
    return stripe.customers.retrieve(id);
  }

  getConnect(id: string): Promise<Stripe.Response<Stripe.Account>> {
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
    params: Stripe.AccountCreateExternalAccountParams
  ): Promise<Stripe.Response<Stripe.ExternalAccount>> {
    return stripe.accounts.createExternalAccount(id, params);
  }

  updateBankAccount(
    sourceId: string,
    connectId: string,
    params: Stripe.AccountCreateExternalAccountParams
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

  async uploadFile(payload: Stripe.FileCreateParams) {
    return stripe.files.create(payload);
  }

  async createPerson(
    stripeConnectId: string,
    payload: Stripe.PersonCreateParams
  ) {
    return stripe.accounts.createPerson(stripeConnectId, payload);
  }

  async payout(
    stripeConnectId: string,
    payload: Stripe.PayoutCreateParams
  ): Promise<Stripe.Response<Stripe.Payout> | false> {
    try {
      const balance = await stripe.balance.retrieve(
        {},
        { stripeAccount: stripeConnectId }
      );
      const isInstant = payload.method === "instant";
      const isStandard = payload.method === "standard";
      const hasInstantBalance =
        balance.instant_available && balance.instant_available?.length > 0;
      const hasStandardBalance = balance.available?.length > 0;

      if (
        (isInstant && hasInstantBalance) ||
        (isStandard && hasStandardBalance)
      ) {
        const action = await stripe.payouts.create(payload, {
          stripeAccount: stripeConnectId,
        });
        return action;
      } else {
        throw new Error("Insufficient balance or invalid payout method.");
      }
    } catch (error) {
      console.error("Error creating payout:", error);
      throw error;
    }
  }

  async transfer(
    payload: Stripe.TransferCreateParams,
    stripeConnectId?: string
  ) {
    return stripe.transfers.create(
      {
        amount: payload.amount,
        currency: payload.currency,
        destination: payload.destination,
      },
      {
        stripeAccount: stripeConnectId,
      }
    );
  }
  reverseTransfer = async (id: string) => {
    return stripe.transfers.createReversal(id);
  };

  platformPayout = async (payload: Stripe.PayoutCreateParams) => {
    return stripe.payouts.create(payload);
  };

  async topup(payload: Stripe.TopupCreateParams) {
    return stripe.topups.create(payload);
  }

  async retrieveBalance(stripeConnectId?: string) {
    if (stripeConnectId) {
      return stripe.balance.retrieve({}, { stripeAccount: stripeConnectId });
    }
    return stripe.balance.retrieve();
  }

  async subscriptions(id?: string) {
    if (id) {
      return stripe.products.retrieve(id);
    }
    return stripe.products.list();
  }
  async createSubscriptionItem(customerId: string, price: string) {
    const obj = stripe.subscriptions.create({
      customer: customerId,
      cancel_at_period_end: true,
      items: [
        {
          price: price,
        },
      ],
    });
    return obj;
  }
  async deleteSubscriptionItem(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  async connectAccountOnboardingLink(payload: {
    account: string;
    refreshUrl: string;
    returnUrl: string;
    type: string;
  }): Promise<Stripe.Response<Stripe.AccountLink>> {
    return await stripe.accountLinks.create({
      account: payload.account,
      refresh_url: payload.refreshUrl,
      return_url: payload.returnUrl,
      type: "account_onboarding",
      collection_options: {
        future_requirements: "include",
        fields: "eventually_due",
      },
    });
  }

  async stripeConnectAccount(
    payload: Stripe.AccountCreateParams
  ): Promise<Stripe.Account> {
    return stripe.accounts.create({
      email: payload.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      country: payload.country,
      settings: {
        payouts: {
          schedule: {
            interval: "manual",
          },
        },
      },
      type: "custom",
    });
  }
}

export const stripeHelper = new StripeHelper();
