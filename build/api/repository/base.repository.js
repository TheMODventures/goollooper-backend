"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_helper_1 = require("../helpers/pagination.helper");
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async getAll(filter, projectField, select, sort, populate, lean, page, limit) {
        let result = this.model.find(filter || {}, projectField || "");
        select && result.select(select);
        sort && result.sort(sort);
        populate && result.populate(populate);
        if (page && limit) {
            const skip = (page - 1) * limit;
            result.skip(skip).limit(limit);
        }
        lean && result.lean(lean);
        return (await result.exec()) || [];
    }
    async getOne(filter, projectField, select, populate, lean = true) {
        const query = this.model.findOne(filter || {}, projectField || {});
        select && query.select(select);
        populate && query.populate(populate);
        lean && query.lean();
        return (await query.exec()) || null;
    }
    async getById(id, projectField, select, populate, lean = true) {
        const query = this.model.findById(id, projectField || {});
        select && query.select(select);
        populate && query.populate(populate);
        lean && query.lean();
        return (await query.exec()) || null;
    }
    async create(entity) {
        const dataset = {
            ...entity,
            _id: new mongoose_1.default.Types.ObjectId(),
        };
        const createdEntity = new this.model(dataset);
        return (await createdEntity.save());
    }
    async createMany(entity) {
        const createdEntity = await this.model.insertMany(entity);
        return createdEntity;
    }
    async updateById(id, updateQuery, options = {}) {
        return ((await this.model.findByIdAndUpdate(id, { ...updateQuery }, { new: true, ...options })) || null);
    }
    async updateByOne(filter, updateQuery, options = {}) {
        return ((await this.model.findOneAndUpdate(filter, updateQuery, {
            new: true,
            ...options,
        })) || null);
    }
    async updateMany(filter, updateQuery, options = {}) {
        return ((await this.model.updateMany(filter, updateQuery, {
            ...options,
        })) || null);
    }
    async delete(filter) {
        const result = await this.model.deleteOne(filter).exec();
        return result.deletedCount === 1 ? true : false;
    }
    async deleteMany(filter) {
        const result = await this.model.deleteMany(filter).exec();
        return result.deletedCount > 1 ? true : false;
    }
    async getCount(filter) {
        return (await this.model.countDocuments(filter || {})) || 0;
    }
    async subDocAction(filter, updateQuery, option) {
        const response = await this.model.updateOne(filter, updateQuery, {
            new: true,
            ...option,
        });
        return response.matchedCount === 0 ? false : true;
    }
    async getDataByAggregate(pipeline, options) {
        const result = await this.model.aggregate(pipeline, options).exec();
        return result;
    }
    async getAllWithPagination(filter, projectField, select, sort, populate, lean, page, limit) {
        const result = await pagination_helper_1.PaginationHelper.getMongoosePaginatedData({
            model: this.model,
            query: filter,
            populate,
            page,
            limit,
            select,
            sort,
        });
        return result;
    }
    async getAllWithAggregatePagination(pipeline, projectField, select, sort, populate, lean, page, limit) {
        const result = await pagination_helper_1.PaginationHelper.getMongooseAggregatePaginatedData({
            model: this.model,
            query: pipeline,
            populate,
            lean,
            page,
            limit,
            select,
            sort,
        });
        return result;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map