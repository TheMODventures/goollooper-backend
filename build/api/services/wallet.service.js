"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const wallet_repository_1 = require("../repository/wallet/wallet.repository");
const user_repository_1 = require("../repository/user/user.repository");
const stripe_service_1 = __importDefault(require("./stripe.service"));
const lodash_1 = __importDefault(require("lodash"));
const stripe_helper_1 = require("../helpers/stripe.helper");
class WalletService {
    constructor() {
        this.index = async (page, limit = 10, filter) => {
            try {
                const getDocCount = await this.walletRepository.getCount(filter);
                const response = await this.walletRepository.getAll(filter, "", "", {
                    createdAt: "desc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, getDocCount);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload, req) => {
            const { idNumber, ssnLast4, dob } = req.body;
            payload.user = req.locals.auth?.userId;
            try {
                const user = await this.userRepository.getById(req.locals.auth?.userId);
                if (user?.wallet)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(409, "Wallet already created for this user");
                if (!user?.isProfileCompleted) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Complete your profile to create wallet");
                }
                if (!user.stripeConnectId &&
                    user.countryCode == "US" &&
                    (!idNumber || !ssnLast4)) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(400, "idNumber and ssnLast4 is required for US country");
                }
                let stripeDataset = { individual: {} };
                stripeDataset = {
                    email: user.email,
                    country: user.countryCode,
                    individual: {
                        address: {
                            line1: user.selectedLocation?.readableLocation,
                            line2: user.selectedLocation?.readableLocation,
                            country: user.selectedLocation?.county,
                            state: user.selectedLocation?.state,
                            city: user.selectedLocation?.city,
                            postal_code: user.selectedLocation?.zipCode,
                        },
                        email: user.email,
                        gender: user.gender,
                        phone: `+${user.phoneCode}${user.phone}`,
                        first_name: user.firstName,
                        last_name: user.lastName,
                    },
                };
                if (user.countryCode == "US" && stripeDataset.individual) {
                    stripeDataset.individual.id_number = idNumber;
                    stripeDataset.individual.ssn_last_4 = ssnLast4;
                }
                if (dob && stripeDataset.individual) {
                    const a = dob.split("-").map((e) => parseInt(e));
                    stripeDataset.individual.dob = { year: a[0], month: a[1], day: a[2] };
                }
                const stripeWallets = await this.stripeService.createWallet(user?.email, stripeDataset);
                if (stripeWallets.code !== 200)
                    return stripeWallets;
                const uploaded = await this.uploadDocuments(stripeWallets.data.stripeConnect.id, req.files);
                if (!uploaded)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(500, "Error while uploading documents");
                const data = await this.walletRepository.create(payload);
                await this.userRepository.updateById(payload.user, {
                    stripeConnectId: stripeWallets.data.stripeConnect.id,
                    stripeCustomerId: stripeWallets.data.stripeCustomer.id,
                    wallet: data._id,
                });
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
            }
            catch (error) {
                console.log(error);
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.show = async (_id) => {
            try {
                const filter = {
                    user: _id,
                };
                const response = await this.walletRepository.getOne(filter);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.update = async (_id, dataset) => {
            try {
                const response = await this.walletRepository.updateByOne({ user: _id }, dataset);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.delete = async (_id) => {
            try {
                const response = await this.walletRepository.delete({ _id });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.uploadDocuments = async (stripeConnectId, files) => {
            let documentFront, documentBack;
            if (files &&
                lodash_1.default.isArray(files) &&
                files?.find((file) => file.fieldname === "identityDocumentFront")) {
                const file = files?.find((file) => file.fieldname === "identityDocumentFront");
                documentFront = await stripe_helper_1.stripeHelper.uploadFile({
                    file: {
                        data: file.buffer,
                    },
                    purpose: "identity_document",
                });
            }
            if (files &&
                lodash_1.default.isArray(files) &&
                files?.find((file) => file.fieldname === "identityDocumentBack")) {
                const file = files?.find((file) => file.fieldname === "identityDocumentBack");
                documentBack = await stripe_helper_1.stripeHelper.uploadFile({
                    file: {
                        data: file.buffer,
                    },
                    purpose: "identity_document",
                });
            }
            if (documentFront && documentBack) {
                await stripe_helper_1.stripeHelper.updateConnect(stripeConnectId, {
                    individual: {
                        verification: {
                            document: { front: documentFront?.id, back: documentBack?.id },
                        },
                    },
                });
                return true;
            }
            return false;
        };
        this.walletRepository = new wallet_repository_1.WalletRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.stripeService = new stripe_service_1.default();
    }
}
exports.default = WalletService;
//# sourceMappingURL=wallet.service.js.map