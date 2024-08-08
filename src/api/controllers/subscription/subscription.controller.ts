import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import SubscriptionService from "../../services/subscription.service";
import {
  ISubscription,
  IPlans,
} from "../../../database/interfaces/subscription.interface";

class SubscriptionController {
  protected subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  index = async (req: Request, res: Response) => {
    const { unique, name } = req.query;
    const response = await this.subscriptionService.index({
      unique: Boolean(unique),
      name: name as string,
    });
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ISubscription = { ...req.body };
    const user = req?.locals?.auth?.userId!;
    const response = await this.subscriptionService.create(payload, user);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.subscriptionService.show(id);
    return res.status(response.code).json(response);
  };
}

export default SubscriptionController;
