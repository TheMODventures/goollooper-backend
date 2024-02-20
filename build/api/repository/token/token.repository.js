"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRepository = void 0;
const token_model_1 = require("../../../database/models/token.model");
const base_repository_1 = require("../base.repository");
class TokenRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(token_model_1.Token);
    }
}
exports.TokenRepository = TokenRepository;
//# sourceMappingURL=token.repository.js.map