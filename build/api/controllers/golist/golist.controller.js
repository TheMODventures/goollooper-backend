"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const golist_service_1 = __importDefault(require("../../services/golist.service"));
const user_service_1 = __importDefault(require("../../services/user.service"));
const enums_1 = require("../../../database/interfaces/enums");
const model_helper_1 = require("../../helpers/model.helper");
class GolistController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, title = "", type = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                title: { $regex: title, $options: "i" },
                createdBy: req.locals.auth?.userId,
                isDeleted: false,
                $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
            };
            if (type)
                filter.type = type;
            const response = await this.golistService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const user = req.locals.auth?.userId;
            const payload = {
                ...req.body,
                createdBy: user,
            };
            if (payload.type === enums_1.EList.myList) {
                payload.title = "My List";
                const phoneContacts = req.body.phoneContacts;
                const users = await this.userService.index(1, 10000, {
                    _id: { $ne: payload.createdBy },
                    phone: { $in: phoneContacts },
                });
                const mylist = await this.golistService.index(1, 1, {
                    type: enums_1.EList.myList,
                    createdBy: user,
                });
                if (mylist.total && mylist.total !== 0) {
                    const item = mylist.data.result[0];
                    const response = await this.golistService.update(item._id?.toString() ?? "", {
                        serviceProviders: users.data.map((e) => e._id),
                        createdBy: user,
                    });
                    return res.status(response.code).json(response);
                }
                if (users.status)
                    payload.serviceProviders = users.data.map((e) => e._id);
            }
            const response = await this.golistService.create(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.golistService.show(id, !req.query.longitude || !req.query.latitude
                ? undefined
                : [
                    parseFloat(req.query.longitude),
                    parseFloat(req.query.latitude),
                ], [
                model_helper_1.ModelHelper.populateData("serviceProviders", model_helper_1.ModelHelper.userSelect, "Users"),
                model_helper_1.ModelHelper.populateData("taskInterests"),
            ]);
            return res.status(response.code).json(response);
        };
        this.showMyList = async (req, res) => {
            const list = await this.golistService.index(1, 1, {
                createdBy: req.locals.auth?.userId,
                type: enums_1.EList.myList,
            });
            if (list.data.pagination.totalItems === 0)
                return res
                    .status(404)
                    .json({ data: null, status: false, msg: "Not found" });
            const response = await this.golistService.show(list.data.result[0]._id.toString(), !req.query.longitude || !req.query.latitude
                ? undefined
                : [
                    parseFloat(req.query.longitude),
                    parseFloat(req.query.latitude),
                ], [
                model_helper_1.ModelHelper.populateData("serviceProviders", model_helper_1.ModelHelper.userSelect, "Users"),
                model_helper_1.ModelHelper.populateData("taskInterests"),
            ]);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.golistService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.golistService.delete(id);
            return res.status(response.code).json(response);
        };
        this.checkPostalCode = async (req, res) => {
            const { zipCode } = req.query;
            const response = await this.golistService.checkPostalCode(zipCode);
            return res.status(response.code).json(response);
        };
        this.getNearestServiceProviders = async (req, res) => {
            const { limit, page } = req.query;
            const { latitude, longitude, zipCode, taskInterests = [], volunteers, subscription, rating, companyLogo, companyRegistration, companyWebsite, companyAffilation, companyPublication, companyResume, certificate, license, reference, insurance, search, visualPhotos, visualVideos, } = req.body;
            const limitNow = limit ? limit : 10;
            const coordinates = [Number(longitude), Number(latitude)];
            const response = await this.golistService.getNearestServiceProviders(Number(page), Number(limitNow), req.locals.auth?.userId, coordinates, taskInterests, volunteers, subscription, zipCode?.toString(), rating ? parseInt(rating.toString()) : undefined, companyLogo, companyRegistration, companyWebsite, companyAffilation, companyPublication, companyResume, certificate, license, reference, insurance, search, visualPhotos, visualVideos);
            return res.status(response.code).json(response);
        };
        this.shareToMyList = async (req, res) => {
            const { serviceProviderId, myList } = req.body;
            const response = await this.golistService.shareToMyList(req.locals.auth?.userId, serviceProviderId, myList);
            return res.status(response.code).json(response);
        };
        this.golistService = new golist_service_1.default();
        this.userService = new user_service_1.default();
    }
}
exports.default = GolistController;
//# sourceMappingURL=golist.controller.js.map