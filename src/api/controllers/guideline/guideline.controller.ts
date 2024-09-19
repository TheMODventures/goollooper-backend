import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import GuidelineService from "../../services/guideline.service";
import { IGuideline } from "../../../database/interfaces/guideline.interface";

class GuidelineController {
  protected guidelineService: GuidelineService;

  constructor() {
    this.guidelineService = new GuidelineService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, name = "", type } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IGuideline> = {
      // name: { $regex: name, $options: "i" },
    };
    if (type) filter.type = Number(type);
    const response = await this.guidelineService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: IGuideline = { ...req.body };
    const response = await this.guidelineService.create(payload);

    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.guidelineService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IGuideline> = { ...req.body };

    const response = await this.guidelineService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.guidelineService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default GuidelineController;
