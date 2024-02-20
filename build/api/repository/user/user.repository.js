"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_repository_1 = require("../base.repository");
const user_model_1 = require("../../../database/models/user.model");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(user_model_1.User);
        this.getCallToken = async (user) => {
            return await this.model.findById(user).select("callToken callDeviceType");
        };
    }
    async create(entity) {
        entity._id = new mongoose_1.default.Types.ObjectId();
        const newEntity = new this.model(entity);
        await newEntity.save();
        delete entity.password;
        return entity;
    }
    async updateByOne(filter, updateQuery) {
        const data = await this.model.findOneAndUpdate(filter, updateQuery, {
            new: true,
        });
        if (data) {
            delete data.password;
        }
        return data || null;
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map