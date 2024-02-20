"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const transaction_model_1 = require("../../../database/models/transaction.model");
const base_repository_1 = require("../base.repository");
class TransactionRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(transaction_model_1.Transaction);
    }
}
exports.TransactionRepository = TransactionRepository;
//# sourceMappingURL=transaction.repository.js.map