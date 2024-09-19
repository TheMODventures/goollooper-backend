import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import ServiceService from "../../services/service.service";
import { IService } from "../../../database/interfaces/service.interface";

class ServiceController {
  protected serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  index = async (req: Request, res: Response) => {
    const {
      limit,
      page,
      title = "",
      type = "",
      search = "",
      parent = "",
    } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IService> = {
      title: { $regex: title, $options: "i" },
      type: { $regex: type },
      isDeleted: false,
    };
    const response = await this.serviceService.index(
      Number(page),
      Number(limitNow),
      String(search).toLowerCase(),
      filter,
      parent as string
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: IService = { ...req.body };
    const response = await this.serviceService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.serviceService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IService> = { ...req.body };

    const response = await this.serviceService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.serviceService.delete(id);
    return res.status(response.code).json(response);
  };

  // populateData = async (req: Request, res: Response) => {
  //   if (req?.file) {
  //     let data = JSON.parse(req?.file.buffer.toString());
  //     const response = await this.serviceService.populateAllData(data);
  //     return res
  //       .status(response.code)
  //       .json({ msg: "Data populated successfully" });
  //   } else {
  //     return res.status(500).json({ msg: "Error populating data" });
  //   }
  // };
}

export default ServiceController;
