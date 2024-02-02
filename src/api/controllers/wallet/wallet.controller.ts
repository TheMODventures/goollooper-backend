import { Request, Response } from "express";

import WalletService from "../../services/wallet.service";

import { IWallet } from "../../../database/interfaces/wallet.interface";

class WalletController {
  protected walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  create = async (req: Request, res: Response) => {
    const payload: IWallet = { ...req.body };
    const response = await this.walletService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const id = req.locals.auth?.userId as string;
    const response = await this.walletService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IWallet> = { ...req.body };

    const response = await this.walletService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  defaultPaymentMethod = async (req: Request, res: Response) => {
    const id = req.locals.auth?.userId as string;
    const dataset: Partial<IWallet> = { ...req.body };

    const response = await this.walletService.update(id, {
      selectedTopupMethod: dataset.selectedTopupMethod,
    });
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.walletService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default WalletController;
