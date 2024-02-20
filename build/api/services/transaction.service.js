"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const transaction_repository_1 = require("../repository/transaction/transaction.repository");
class TransactionService {
    constructor() {
        this.index = async (page, limit = 10, filter) => {
            try {
                const getDocCount = await this.transactionRepository.getCount(filter);
                const response = await this.transactionRepository.getAll(filter, "", "", {
                    createdAt: "desc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, getDocCount);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.show = async (_id) => {
            try {
                const filter = {
                    _id,
                };
                const response = await this.transactionRepository.getOne(filter, undefined, undefined, [
                    {
                        path: "user",
                        model: "Users",
                        select: "firstName lastName userName email",
                    },
                    {
                        path: "task",
                        model: "Task",
                        select: "title",
                    },
                    {
                        path: "subscription",
                        model: "Subscription",
                        select: "name",
                    },
                ]);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload) => {
            try {
                const data = await this.transactionRepository.create(payload);
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.update = async (_id, dataset) => {
            try {
                const response = await this.transactionRepository.updateById(_id, dataset);
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
                const response = await this.transactionRepository.delete({
                    _id,
                });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.transactionRepository = new transaction_repository_1.TransactionRepository();
    }
}
exports.default = TransactionService;
//# sourceMappingURL=transaction.service.js.map