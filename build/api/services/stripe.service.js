"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("../repository/user/user.repository");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const stripe_helper_1 = require("../helpers/stripe.helper");
const constant_1 = require("../../constant");
const wallet_repository_1 = require("../repository/wallet/wallet.repository");
const transaction_repository_1 = require("../repository/transaction/transaction.repository");
const enums_1 = require("../../database/interfaces/enums");
class StripeService {
    constructor() {
        this.payout = async (req) => {
            try {
                const connect = await this.getConnect(req.locals.auth?.userId);
                if (connect.status) {
                    const withdraw = await stripe_helper_1.stripeHelper.payout(connect.data.id, {
                        method: "standard",
                        destination: req.params.source,
                        currency: connect.data.default_currency,
                    });
                    if (withdraw === false)
                        return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Withdrawal failed");
                    else if (withdraw.id) {
                        const wallet = await this.walletRepository.updateBalance(req.locals.auth?.userId, -(withdraw.amount / 100));
                        this.transactionRepository.create({
                            amount: withdraw.amount / 100,
                            user: req.locals.auth?.userId,
                            type: enums_1.TransactionType.withdraw,
                            wallet: wallet?._id,
                        });
                        return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Withdrawal successfull", withdraw);
                    }
                    throw withdraw;
                }
                throw connect;
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(400, error?.code === "parameter_invalid_integer"
                    ? "Balance is low"
                    : error.message);
            }
        };
        this.userRepository = new user_repository_1.UserRepository();
        this.walletRepository = new wallet_repository_1.WalletRepository();
        this.transactionRepository = new transaction_repository_1.TransactionRepository();
    }
    async createWallet(email, dataset) {
        try {
            let stripeCustomer;
            const stripeConnect = await stripe_helper_1.stripeHelper.createConnect(email, dataset);
            if (stripeConnect.id)
                stripeCustomer = await stripe_helper_1.stripeHelper.createStripeCustomer(email);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("stripe accounts created successfully", { stripeConnect, stripeCustomer });
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async getConnect(id) {
        const user = await this.userRepository.getById(id, undefined, "stripeConnectId");
        if (!user)
            return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
        const connect = await stripe_helper_1.stripeHelper.getConnect(user.stripeConnectId);
        if (!connect)
            return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Connect account not found");
        return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Connect account found", connect);
    }
    async addCardToCustomer(req) {
        const { cardNumber, expMonth, expYear, cvc } = req.body;
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const cardObj = {
                number: cardNumber,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
            };
            const token = await stripe_helper_1.stripeHelper.createToken({ card: cardObj });
            const card = await stripe_helper_1.stripeHelper.addCard(user?.stripeCustomerId, token.id);
            if (!card)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Card not added");
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Card added successfully", card);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async updateCardToCustomer(req) {
        const { expMonth, expYear, name } = req.body;
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const cardObj = {
                exp_month: expMonth,
                exp_year: expYear,
                name,
            };
            const card = await stripe_helper_1.stripeHelper.updateCard(user?.stripeCustomerId, req.params.id, cardObj);
            if (!card)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Card not updated");
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Card updated successfully", card);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async getCustomerCards(req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const banks = await stripe_helper_1.stripeHelper.getCustomerCards(user.stripeCustomerId, parseInt(req.body.page));
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Card list found", banks);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async selectDefaultCard(req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const card = await stripe_helper_1.stripeHelper.selectDefaultCard(user.stripeCustomerId, req.params.id);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Default card updated", card);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async createTopUp(req) {
        let { amount, source, currency, description } = req.body;
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user?.stripeCustomerId) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Please add a card first");
            }
            const customer = await stripe_helper_1.stripeHelper.updateCustomer(user.stripeCustomerId, { source });
            if (!customer) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Customer not updated");
            }
            const charge = await stripe_helper_1.stripeHelper.stripeCharge({
                amount: amount * 100,
                currency,
                customer: user.stripeCustomerId,
                description,
            });
            if (charge.status == "succeeded") {
                const wallet = await this.walletRepository.updateBalance(req.locals.auth?.userId, amount);
                this.transactionRepository.create({
                    amount,
                    user: req.locals.auth?.userId,
                    type: enums_1.TransactionType.topUp,
                    wallet: wallet?._id,
                });
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Top up created successfully", { charge, wallet });
            }
            throw charge;
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async createPaymentIntent(req) {
        const body = req.body;
        body.amount = body.amount * 100;
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user?.stripeCustomerId) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Please add a card first");
            }
            body.customer = user?.stripeCustomerId;
            const paymentIntent = await stripe_helper_1.stripeHelper.createPaymentIntent(body);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Payment intent created successfully", paymentIntent);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async confirmPayment(req) {
        const { paymentIntentId } = req.body;
        try {
            const paymentIntent = await stripe_helper_1.stripeHelper.confirmPaymentIntent(paymentIntentId);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Payment intent confirmed successfully", paymentIntent);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async webhook(req, res) {
        const sig = req.headers["stripe-signature"];
        let event;
        try {
            event = await stripe_helper_1.stripeHelper.stripeWebHook(req.body, sig);
        }
        catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        console.log("event >>>>>>>>>>", event);
        // Handle the event
        switch (event.type) {
            case "customer.subscription.pending_update_expired":
                const customerSubscriptionPendingUpdateExpired = event.data.object;
                // Then define and call a function to handle the event customer.subscription.pending_update_expired
                break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        // Return a 200 response to acknowledge receipt of the event
        res.send();
    }
    async getStripeCustomer(req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const customer = await stripe_helper_1.stripeHelper.getStripeCustomer(user.stripeCustomerId);
            if (!customer)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Customer not found");
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Customer retreived", customer);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async addBank(req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeConnectId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const connect = await stripe_helper_1.stripeHelper.getConnect(user.stripeConnectId);
            if (!connect)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Connect not found");
            const bank = await stripe_helper_1.stripeHelper.addBankAccount(user.stripeConnectId, { external_account: req.body });
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Bank account added", bank);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async updateBank(sourceId, req) {
        try {
            const { account_holder_name, account_holder_type } = req.body;
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeConnectId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const connect = await stripe_helper_1.stripeHelper.getConnect(user.stripeConnectId);
            if (!connect)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Connect not found");
            const bank = await stripe_helper_1.stripeHelper.updateBankAccount(sourceId, user.stripeConnectId, {
                account_holder_name,
                account_holder_type,
            });
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Bank account updated", bank);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async deleteBank(sourceId, req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeConnectId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const connect = await stripe_helper_1.stripeHelper.getConnect(user.stripeConnectId);
            if (!connect)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Connect not found");
            const result = await stripe_helper_1.stripeHelper.deleteBank(sourceId, user.stripeConnectId);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED, result);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async deleteSource(sourceId, req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const customer = await stripe_helper_1.stripeHelper.getStripeCustomer(user.stripeCustomerId);
            if (!customer)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "Customer not found");
            const result = await stripe_helper_1.stripeHelper.deleteSource(sourceId, user.stripeCustomerId);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED, result);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async getBankAccounts(req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeConnectId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const banks = await stripe_helper_1.stripeHelper.getBankAccounts(user.stripeConnectId, parseInt(req.body.page));
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Bank list found", banks);
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async getPaymentMethods(req) {
        try {
            const user = await this.userRepository.getById(req.locals.auth?.userId ?? "", undefined, "stripeCustomerId");
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "User not found");
            const paymentMethods = await stripe_helper_1.stripeHelper.getPaymentMethods(user.stripeCustomerId, parseInt(req.body.page));
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Payment methods list found", paymentMethods.data.filter((a) => a.object !== "source" && a.object !== "bank_account"));
        }
        catch (error) {
            return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
}
exports.default = StripeService;
//# sourceMappingURL=stripe.service.js.map