"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountyRepository = void 0;
const county_model_1 = require("../../../database/models/county.model");
const base_repository_1 = require("../base.repository");
class CountyRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(county_model_1.County);
        this.getOneByFilter = async (filter) => {
            const response = await this.model.findOne(filter);
            return response;
        };
    }
}
exports.CountyRepository = CountyRepository;
//# sourceMappingURL=county.repository.js.map