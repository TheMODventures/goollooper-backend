"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const city_repository_1 = require("../repository/city/city.repository");
class CityService {
    constructor() {
        this.index = async (page, limit = 10, filter) => {
            try {
                const getDocCount = await this.cityRepository.getCount(filter);
                const response = await this.cityRepository.getAll(filter, "", "", {
                    createdAt: "desc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, getDocCount);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload) => {
            try {
                const data = await this.cityRepository.create(payload);
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
                const response = await this.cityRepository.getOne(filter);
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
                const response = await this.cityRepository.updateById(_id, dataset);
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
                const response = await this.cityRepository.delete({ _id });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.cityRepository = new city_repository_1.CityRepository();
    }
}
exports.default = CityService;
//# sourceMappingURL=city.service.js.map