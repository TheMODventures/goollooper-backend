import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import ServiceService from "../../services/service.service";
import {
  IService,
  ISubService,
} from "../../../database/interfaces/service.interface";

class ServiceController {
  protected serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, title = "", type = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IService> = {
      title: { $regex: title, $options: "i" },
      type: { $regex: type },
      isDeleted: false,
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
    };
    const response = await this.serviceService.index(
      Number(page),
      Number(limitNow),
      filter
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

  // sub-services
  addSubService = async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    const payload: ISubService = { ...req.body };
    const response = await this.serviceService.addSubService(
      serviceId,
      payload
    );
    return res.status(response.code).json(response);
  };

  updateSubService = async (req: Request, res: Response) => {
    const { serviceId, id } = req.params;
    const dataset: Partial<ISubService> = { ...req.body };

    const response = await this.serviceService.updateSubService(
      serviceId,
      id,
      dataset
    );
    return res.status(response.code).json(response);
  };

  deleteSubService = async (req: Request, res: Response) => {
    const { serviceId, id } = req.params;
    const response = await this.serviceService.removeSubService(serviceId, id);
    return res.status(response.code).json(response);
  };
}

export default ServiceController;
