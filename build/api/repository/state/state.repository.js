"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateRepository = void 0;
const state_model_1 = require("../../../database/models/state.model");
const base_repository_1 = require("../base.repository");
class StateRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(state_model_1.State);
    }
}
exports.StateRepository = StateRepository;
//# sourceMappingURL=state.repository.js.map