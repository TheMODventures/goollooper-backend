"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_service_1 = __importDefault(require("../../services/wallet.service"));
class WalletController {
    constructor() {
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.walletService.create(payload, req);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const id = req.locals.auth?.userId;
            const response = await this.walletService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.walletService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.defaultPaymentMethod = async (req, res) => {
            const id = req.locals.auth?.userId;
            const dataset = { ...req.body };
            const response = await this.walletService.update(id, {
                selectedTopupMethod: dataset.selectedTopupMethod,
            });
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.walletService.delete(id);
            return res.status(response.code).json(response);
        };
        this.walletService = new wallet_service_1.default();
    }
}
exports.default = WalletController;
//# sourceMappingURL=wallet.controller.js.map