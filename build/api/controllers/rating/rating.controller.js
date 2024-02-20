"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const rating_service_1 = __importDefault(require("../../services/rating.service"));
const model_helper_1 = require("../../helpers/model.helper");
class RatingController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page = 1 } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                // name: { $regex: name, $options: "i" },
                to: new mongoose_1.default.Types.ObjectId(req.params.user),
            };
            const response = await this.ratingService.index(Number(page), Number(limitNow), filter, [
                model_helper_1.ModelHelper.populateData("by", model_helper_1.ModelHelper.userSelect, "Users"),
                // ModelHelper.populateData(
                //   "data.serviceProvider",
                //   ModelHelper.userSelect,
                //   "Users",
                //   [
                //     ModelHelper.populateData(
                //       "subscription.subscription",
                //       ModelHelper.subscriptionSelect
                //     ),
                //   ]
                // ),
            ]);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.ratingService.create(payload);
            return res.status(response.code).json(response);
        };
        this.createMultiple = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.ratingService.createMultiple(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.ratingService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.ratingService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.ratingService.delete(id);
            return res.status(response.code).json(response);
        };
        this.ratingService = new rating_service_1.default();
    }
}
exports.default = RatingController;
//# sourceMappingURL=rating.controller.js.map