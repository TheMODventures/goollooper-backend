"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_service_1 = __importDefault(require("../../services/transaction.service"));
class TransactionController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, type = "" } = req.query;
            const limitNow = limit ? limit : 10;
            let filter = {};
            if (type) {
                filter = {
                    type: type,
                };
            }
            const response = await this.transactionService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.transactionService.show(id);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.transactionService.create(payload);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.transactionService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.transactionService.delete(id);
            return res.status(response.code).json(response);
        };
        this.transactionService = new transaction_service_1.default();
    }
}
exports.default = TransactionController;
//# sourceMappingURL=transaction.controller.js.map