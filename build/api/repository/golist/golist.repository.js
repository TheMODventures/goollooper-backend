"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GolistRepository = void 0;
const golist_model_1 = require("../../../database/models/golist.model");
const base_repository_1 = require("../base.repository");
class GolistRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(golist_model_1.Golist);
    }
}
exports.GolistRepository = GolistRepository;
//# sourceMappingURL=golist.repository.js.map