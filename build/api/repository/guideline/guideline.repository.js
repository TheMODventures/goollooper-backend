"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidelineRepository = void 0;
const guideline_model_1 = require("../../../database/models/guideline.model");
const base_repository_1 = require("../base.repository");
class GuidelineRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(guideline_model_1.Guideline);
        this.getOneByFilter = async (filter) => {
            const response = await this.model.findOne(filter);
            return response;
        };
    }
}
exports.GuidelineRepository = GuidelineRepository;
//# sourceMappingURL=guideline.repository.js.map