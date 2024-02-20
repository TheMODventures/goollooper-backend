"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityRepository = void 0;
const city_model_1 = require("../../../database/models/city.model");
const base_repository_1 = require("../base.repository");
class CityRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(city_model_1.City);
        this.getOneByFilter = async (filter) => {
            const response = await this.model.findOne(filter);
            return response;
        };
    }
}
exports.CityRepository = CityRepository;
//# sourceMappingURL=city.repository.js.map