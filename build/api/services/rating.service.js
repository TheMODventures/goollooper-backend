"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const rating_repository_1 = require("../repository/rating/rating.repository");
class RatingService {
    constructor() {
        this.index = async (page, limit = 20, filter, populate) => {
            try {
                // const getDocCount = await this.ratingRepository.getCount(filter);
                const response = await this.ratingRepository.getAllWithPagination(filter, "", "", {
                    createdAt: "desc",
                }, populate, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, response.pagination.totalItems);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload) => {
            try {
                const data = await this.ratingRepository.create(payload);
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.createMultiple = async (payload) => {
            try {
                const reviews = payload.to.map((e) => {
                    return {
                        star: payload.star,
                        description: payload.description || null,
                        by: payload.by,
                        to: e,
                        task: payload.task,
                    };
                });
                const data = await this.ratingRepository.createMany(reviews);
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
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
                const response = await this.ratingRepository.getOne(filter);
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
                const response = await this.ratingRepository.updateById(_id, dataset);
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
                const response = await this.ratingRepository.delete({
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
        this.ratingRepository = new rating_repository_1.RatingRepository();
    }
}
exports.default = RatingService;
//# sourceMappingURL=rating.service.js.map