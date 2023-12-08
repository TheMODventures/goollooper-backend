import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import StateService from "../../services/state.service";
import { IState } from "../../../database/interfaces/state.interface";

class StateController {
  protected stateService: StateService;

  constructor() {
    this.stateService = new StateService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, name = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IState> = {
      name: { $regex: name, $options: "i" },
      isDeleted: false,
    };
    const response = await this.stateService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: IState = { ...req.body };
    const response = await this.stateService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.stateService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IState> = { ...req.body };

    const response = await this.stateService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.stateService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default StateController;
