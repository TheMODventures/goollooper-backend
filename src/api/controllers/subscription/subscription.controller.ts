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
    const { limit, page, name = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<ISubscription> = {
      name: { $regex: name, $options: "i" },
      isDeleted: false,
    };
    const response = await this.subscriptionService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: ISubscription = { ...req.body };
    const response = await this.subscriptionService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.subscriptionService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<ISubscription> = { ...req.body };

    const response = await this.subscriptionService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.subscriptionService.delete(id);
    return res.status(response.code).json(response);
  };

  // plans
  addPlan = async (req: Request, res: Response) => {
    const { subscriptionId } = req.params;
    const payload: IPlans = { ...req.body };
    const response = await this.subscriptionService.addPlan(
      subscriptionId,
      payload
    );
    return res.status(response.code).json(response);
  };

  updatePlan = async (req: Request, res: Response) => {
    const { subscriptionId, id } = req.params;
    const dataset: Partial<IPlans> = { ...req.body };

    const response = await this.subscriptionService.updatePlan(
      subscriptionId,
      id,
      dataset
    );
    return res.status(response.code).json(response);
  };

  deletePlan = async (req: Request, res: Response) => {
    const { subscriptionId, id } = req.params;
    const response = await this.subscriptionService.removePlan(
      subscriptionId,
      id
    );
    return res.status(response.code).json(response);
  };
}

export default SubscriptionController;
