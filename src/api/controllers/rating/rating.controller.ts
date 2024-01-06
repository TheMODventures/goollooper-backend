import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";

import RatingService from "../../services/rating.service";

import { IRating } from "../../../database/interfaces/rating.interface";
import { ModelHelper } from "../../helpers/model.helper";

class RatingController {
  protected ratingService: RatingService;

  constructor() {
    this.ratingService = new RatingService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page = 1 } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IRating> = {
      // name: { $regex: name, $options: "i" },
      to: new mongoose.Types.ObjectId(req.params.user),
    };
    const response = await this.ratingService.index(
      Number(page),
      Number(limitNow),
      filter,
      [
        ModelHelper.populateData("by", ModelHelper.userSelect, "Users"),
        // ModelHelper.populateData(
        //   "data.serviceProvider",
        //   ModelHelper.userSelect,
        //   "Users",
        //   [
        //     ModelHelper.populateData(
        //       "subscription.subscription",
        //       ModelHelper.subscriptionSelect
        //     ),
        //   ]
        // ),
      ]
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: IRating = { ...req.body };
    const response = await this.ratingService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.ratingService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IRating> = { ...req.body };

    const response = await this.ratingService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.ratingService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default RatingController;