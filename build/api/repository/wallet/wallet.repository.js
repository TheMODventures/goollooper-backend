"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const wallet_model_1 = require("../../../database/models/wallet.model");
const base_repository_1 = require("../base.repository");
class WalletRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(wallet_model_1.Wallet);
        this.getOneByFilter = async (filter) => {
            const response = await this.model.findOne(filter);
            return response;
        };
        this.updateBalance = async (user, amount) => {
            return await this.model.findOneAndUpdate({
                user: new mongoose_1.default.Types.ObjectId(user),
            }, { $inc: { balance: amount } }, { new: true });
        };
    }
}
exports.WalletRepository = WalletRepository;
//# sourceMappingURL=wallet.repository.js.map