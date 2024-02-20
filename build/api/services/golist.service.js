"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bson_1 = require("bson");
const golist_repository_1 = require("../repository/golist/golist.repository");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const constant_1 = require("../../constant");
const user_service_1 = __importDefault(require("./user.service"));
const googleMapApi_helper_1 = require("../helpers/googleMapApi.helper");
const notification_repository_1 = require("../repository/notification/notification.repository");
const enums_1 = require("../../database/interfaces/enums");
const notification_helper_1 = require("../helpers/notification.helper");
const user_repository_1 = require("../repository/user/user.repository");
class GolistService {
    constructor() {
        this.index = async (page, limit = 10, filter) => {
            try {
                // const getDocCount = await this.golistRepository.getCount(filter);
                const response = await this.golistRepository.getAllWithPagination(filter, "", "", {
                    createdAt: "desc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, response.pagination.totalItems);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload) => {
            try {
                const data = await this.golistRepository.create(payload);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_INSERTION_PASSED, data);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.show = async (_id, coordinates, populate) => {
            try {
                const filter = {
                    _id: new bson_1.ObjectId(_id),
                };
                const response = await this.golistRepository.getOne(filter, undefined, undefined, undefined);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                const query = [];
                if (coordinates) {
                    query.push({
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: coordinates ?? [67.0, 24.0],
                            },
                            distanceField: "distance",
                            spherical: true,
                            // maxDistance: 10000,
                            query: { _id: { $in: response?.serviceProviders } },
                        },
                    });
                }
                query.push(...[
                    { $match: { _id: { $in: response?.serviceProviders } } },
                    {
                        $project: {
                            username: 1,
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            phone: 1,
                            profileImage: 1,
                            distance: 1,
                        },
                    },
                ]);
                const serviceProviders = await this.userRepository.getDataByAggregate(query);
                response.serviceProviders = serviceProviders;
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.update = async (_id, dataset) => {
            try {
                const response = await this.golistRepository.updateByOne({ _id }, dataset);
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
                const response = await this.golistRepository.updateById(_id, {
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
        this.checkPostalCode = async (zipCode) => {
            const googleCoordinates = (await googleMapApi_helper_1.GoogleMapHelper.searchLocation(zipCode, ""));
            if (!googleCoordinates)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, "postal code is invalid");
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Valid postal code", {
                latitude: googleCoordinates[1],
                longitude: googleCoordinates[0],
            });
        };
        this.getNearestServiceProviders = async (page, limit = 10, userId, coordinates, serviceId, volunteerIds, subscription, zipCode, rating, companyLogo, companyRegistration, companyWebsite, companyAffilation, companyPublication, companyResume, certificate, license, reference, insurance, search, visualPhotos, visualVideos) => {
            try {
                const query = [];
                if (zipCode) {
                    // coordinates = []
                    const googleCoordinates = (await googleMapApi_helper_1.GoogleMapHelper.searchLocation(zipCode, ""));
                    if (!googleCoordinates)
                        return reponseapi_helper_1.ResponseHelper.sendResponse(404, "postal code is invalid");
                    coordinates = googleCoordinates;
                }
                if (coordinates?.length !== 0 && !isNaN(coordinates[0])) {
                    query.push({
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: coordinates,
                            },
                            distanceField: "distance",
                            spherical: true,
                            maxDistance: 10000,
                        },
                    });
                }
                const match = {
                    _id: { $ne: new bson_1.ObjectId(userId) },
                    isDeleted: false,
                    role: enums_1.EUserRole.serviceProvider,
                    // isActive: true,
                    // isVerified: true,
                    isProfileCompleted: true,
                };
                if (companyLogo)
                    match["company.logo"] = { $ne: null };
                if (companyRegistration)
                    match["company.name"] = { $ne: null };
                if (companyWebsite)
                    match["company.website"] = { $ne: null };
                if (companyAffilation)
                    match["company.affiliation"] = { $ne: null };
                if (companyPublication)
                    match["company.publication"] = { $ne: null };
                if (companyResume)
                    match["company.resume"] = { $ne: null };
                if (insurance)
                    match["insurances"] = { $ne: [] };
                else if (insurance === false)
                    match["insurances"] = [];
                if (certificate)
                    match["certificates"] = { $ne: [] };
                else if (certificate === false)
                    match["certificates"] = [];
                if (reference)
                    match["reference.name"] = { $ne: null };
                else if (reference === false)
                    match["reference.name"] = null;
                if (license)
                    match["licenses"] = { $ne: [] };
                else if (license === false)
                    match["licenses"] = [];
                if (visualPhotos)
                    match["visuals"] = { $regex: /\.(jpg|jpeg|png|gif|bmp)$/i };
                else if (visualPhotos === false && visualVideos === false)
                    match["visuals"] = [];
                if (visualVideos)
                    match["visuals"] = { $regex: /\.(mp4|avi|mov|mkv)$/i };
                else if (visualPhotos === false && visualVideos === false)
                    match["visuals"] = [];
                if (visualPhotos && visualVideos)
                    match["visuals"] = {
                        $regex: /\.(mp4|avi|mov|mkv|jpg|jpeg|png|gif|bmp)$/i,
                    };
                if (subscription) {
                    match["subscription.subscription"] = new bson_1.ObjectId(subscription);
                }
                if (serviceId && serviceId?.length > 0) {
                    const services = serviceId.map((e) => new bson_1.ObjectId(e));
                    match["$or"] = [
                        {
                            services: {
                                $in: services,
                            },
                        },
                    ];
                }
                if (volunteerIds && volunteerIds?.length > 0) {
                    const volunteers = volunteerIds.map((e) => new bson_1.ObjectId(e));
                    match["$or"] = [
                        {
                            volunteer: {
                                $in: volunteers,
                            },
                        },
                    ];
                }
                query.push({
                    $match: match,
                });
                query.push({
                    $addFields: {
                        fullName: { $concat: ["$firstName", " ", "$lastName"] },
                    },
                });
                if (search) {
                    query.push({
                        $match: {
                            $or: [
                                { fullName: { $regex: search, $options: "i" } },
                                { firstName: { $regex: search, $options: "i" } },
                                { lastName: { $regex: search, $options: "i" } },
                                { username: { $regex: search, $options: "i" } },
                                { email: { $regex: search, $options: "i" } },
                            ],
                        },
                    });
                }
                if (rating) {
                    query.push({ $sort: { averageRating: rating } });
                }
                query.push(...[
                    {
                        $lookup: {
                            as: "subscription",
                            from: "subscriptions",
                            localField: "subscription.subscription",
                            foreignField: "_id",
                        },
                    },
                    {
                        $addFields: {
                            subscription: { $first: "$subscription" },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            phone: 1,
                            ratingCount: 1,
                            averageRating: 1,
                            profileImage: 1,
                            subscriptionName: {
                                $ifNull: ["$subscription.name", null],
                            },
                            distance: 1,
                        },
                    },
                ]);
                const users = await new user_service_1.default().getDataByAggregate(page, limit, query);
                return users;
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.shareToMyList = async (sender, serviceProviderId, myList) => {
            const list = myList.map((e) => {
                return {
                    sender,
                    receiver: e,
                    type: enums_1.ENOTIFICATION_TYPES.SHARE_PROVIDER,
                    content: "#sender Shared A Service Provider",
                    data: { serviceProvider: new bson_1.ObjectId(serviceProviderId) },
                };
            });
            const result = await this.notificationRepository.createMany(list);
            const users = await this.userRepository.getAll({ _id: myList }, undefined, "fcmTokens");
            users.forEach((e) => {
                if (e.fcmTokens && e.fcmTokens.length > 0)
                    notification_helper_1.NotificationHelper.sendNotification({
                        title: "",
                        tokens: e?.fcmTokens,
                        body: "#sender Shared A Service Provider",
                        data: {
                            serviceProvider: serviceProviderId,
                            type: enums_1.ENOTIFICATION_TYPES.SHARE_PROVIDER,
                        },
                    });
            });
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_INSERTION_PASSED, result);
        };
        this.golistRepository = new golist_repository_1.GolistRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
}
exports.default = GolistService;
//# sourceMappingURL=golist.service.js.map