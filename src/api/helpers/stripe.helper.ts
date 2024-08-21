import Stripe from "stripe";
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} from "../../config/environment.config";

const stripe = new Stripe(STRIPE_SECRET_KEY as string, {});
const stripePk = new Stripe(process.env.STRIPE_PUBLISHABLE_KEY as string, {});
class StripeHelper {
  createStripeCustomer(email?: string): Promise<Stripe.Customer> {
    return stripe.customers.create({ email });
  }

  createConnect(
    email: string,
    dataset: Stripe.AccountCreateParams
  ): Promise<Stripe.Account> {
    return stripe.accounts.create({
      email,
      // ...dataset,
      // type: "custom",
      // capabilities: {
      //   card_payments: { requested: true },
      //   transfers: { requested: true },
      // },
      // settings: {
      //   payouts: {
      //     schedule: {
      //       interval: "manual",
      //     },
      //   },
      // },
      // business_type: "individual",
      // tos_acceptance: { ip: "8.8.8.8", date: Math.floor(Date.now() / 1000) },
      // business_profile: {
      //   url: "goollooper.com",
      //   mcc: "5734",
      // },
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
    params: Stripe.AccountCreateExternalAccountParams // previous interface was deprecated thats why change to AccountCreateExternalAccountParams
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

      console.log(balance, "Balance");

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
      throw error; // Re-throw the error to be handled by the calling code
    }
  }

  async transfer(
    payload: Stripe.TransferCreateParams,
    stripeConnectId: string
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
      items: [
        {
          price: price,
        },
      ],
    });
    console.log(obj, "Subscription Item");
    return obj;
  }

  async connectAccountOnboardingLink(
    accountId: string
  ): Promise<Stripe.Response<Stripe.AccountSession>> {
    return await stripe.accountSessions.create({
      account: accountId, // Replace with your connected account ID
      components: {
        payment_details: {
          enabled: true,
        },
        documents: {
          enabled: true,
        },
        payments: {
          enabled: true,
          features: {
            refund_management: true,
            dispute_management: true,
            capture_payments: true,
          },
        },
        payouts: {
          enabled: true,
          features: {
            instant_payouts: true,
            standard_payouts: true,
            edit_payout_schedule: true,
          },
        },
        account_onboarding: {
          enabled: true,
        },
      },
    });
  }

  async stripeConnectAccount(
    payload: Stripe.AccountUpdateParams
  ): Promise<Stripe.Account> {
    return stripe.accounts.create({
      email: payload.email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        url: "goollooper.com",
        mcc: "5734",
      },
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
