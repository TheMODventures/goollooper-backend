import { Request, Response } from "express";

import { IIndustry } from "../../../database/interfaces/industry.interface";
import IndustryService from "../../services/industry.service";

class IndustryController {
  protected industryService: IndustryService;

  constructor() {
    this.industryService = new IndustryService();
  }

  create = async (req: Request, res: Response) => {
    const payload: IIndustry = { ...req.body };
    const response = await this.industryService.create(payload);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.industryService.delete(id);
    console.log(response, "Response");

    return res.status(response.code).json(response);
  };

  index = async (req: Request, res: Response) => {
    const response = await this.industryService.index();
    return res.status(response.code).json(response);
  };
}

export default IndustryController;
