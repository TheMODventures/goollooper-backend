"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRepository = void 0;
const service_model_1 = require("../../../database/models/service.model");
const base_repository_1 = require("../base.repository");
class ServiceRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(service_model_1.Service);
    }
}
exports.ServiceRepository = ServiceRepository;
//# sourceMappingURL=service.repository.js.map