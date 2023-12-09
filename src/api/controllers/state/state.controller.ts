import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import StateService from "../../services/state.service";
import CityService from "../../services/city.service";
import CountyService from "../../services/county.service";
import { IState } from "../../../database/interfaces/state.interface";
import { ICity } from "../../../database/interfaces/city.interface";
import { ICounty } from "../../../database/interfaces/county.interface";

class StateController {
  protected stateService: StateService;
  protected cityService: CityService;
  protected countyService: CountyService;

  constructor() {
    this.stateService = new StateService();
    this.cityService = new CityService();
    this.countyService = new CountyService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, name = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IState> = {
      name: { $regex: name, $options: "i" },
    };
    const response = await this.stateService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  getCities = async (req: Request, res: Response) => {
    const { limit, page, name = "", stateId = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<ICity> = {
      name: { $regex: name, $options: "i" },
    };
    if (stateId) {
      filter.state = stateId;
    }
    const response = await this.cityService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  getCounties = async (req: Request, res: Response) => {
    const { limit, page, name = "", stateId = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<ICounty> = {
      name: { $regex: name, $options: "i" },
    };
    if (stateId) {
      filter.state = stateId;
    }
    const response = await this.countyService.index(
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

  // populateData = async (req: Request, res: Response) => {
  //   if (req?.file) {
  //     let data = JSON.parse(req?.file.buffer.toString());
  //     const response = await this.stateService.populateAllData(data);
  //     return res
  //       .status(response.code)
  //       .json({ msg: "Data populated successfully" });
  //   } else {
  //     return res.status(500).json({ msg: "Error populating data" });
  //   }
  // };
}

export default StateController;
