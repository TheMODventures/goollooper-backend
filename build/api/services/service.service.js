"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const service_repository_1 = require("../repository/service/service.repository");
class ServiceService {
    constructor() {
        this.index = async (page, limit = 10, filter) => {
            try {
                const getDocCount = await this.serviceRepository.getCount(filter);
                const pipeline = [
                    { $match: filter },
                    {
                        $lookup: {
                            from: "services",
                            localField: "_id",
                            foreignField: "parent",
                            as: "subServices",
                        },
                    },
                    {
                        $addFields: {
                            subServices: {
                                $filter: {
                                    input: "$subServices",
                                    as: "child",
                                    cond: { $ne: ["$$child._id", "$_id"] },
                                },
                            },
                        },
                    },
                    {
                        $unwind: "$subServices",
                    },
                    {
                        $group: {
                            _id: "$_id",
                            title: { $first: "$title" },
                            type: { $first: "$type" },
                            subServices: { $push: "$subServices" },
                            matchedServices: {
                                $addToSet: {
                                    $cond: {
                                        if: { $ne: ["$_id", "$subServices._id"] },
                                        then: "$_id",
                                        else: null,
                                    },
                                },
                            },
                        },
                    },
                    {
                        $unwind: "$matchedServices",
                    },
                    {
                        $match: {
                            matchedServices: { $ne: null },
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            type: 1,
                            subServices: {
                                $map: {
                                    input: "$subServices",
                                    as: "child",
                                    in: {
                                        _id: "$$child._id",
                                        title: "$$child.title",
                                        parent: "$$child.parent",
                                    },
                                },
                            },
                        },
                    },
                ];
                const response = await this.serviceRepository.getAllWithAggregatePagination(pipeline, "", "", {
                    title: "asc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, getDocCount);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload) => {
            try {
                const data = await this.serviceRepository.create(payload);
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.show = async (_id) => {
            try {
                const filter = {
                    _id: _id,
                };
                const response = await this.serviceRepository.getOne(filter);
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
                const response = await this.serviceRepository.updateById(_id, dataset);
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
                const response = await this.serviceRepository.updateById(_id, {
                    isDeleted: true,
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
        this.serviceRepository = new service_repository_1.ServiceRepository();
    }
}
exports.default = ServiceService;
//# sourceMappingURL=service.service.js.map