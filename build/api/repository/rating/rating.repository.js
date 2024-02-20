"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingRepository = void 0;
const base_repository_1 = require("../base.repository");
const rating_model_1 = require("../../../database/models/rating.model");
class RatingRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(rating_model_1.Rating);
        this.getOneByFilter = async (filter) => {
            const response = await this.model.findOne(filter);
            return response;
        };
    }
}
exports.RatingRepository = RatingRepository;
//# sourceMappingURL=rating.repository.js.map