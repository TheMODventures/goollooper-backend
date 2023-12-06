import { Request, Response } from "express";
import { IGolist } from "../../../database/interfaces/golist.interface";
import GolistService from "../../services/golist.service";
import { FilterQuery } from "mongoose";

class GolistController {
  protected golistService: GolistService;

  constructor() {
    this.golistService = new GolistService();
  }
  index = async (req: Request, res: Response) => {
    const { limit, page, title = "", type = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IGolist> = {
      title: { $regex: title, $options: "i" },
      createdBy: req.locals.auth?.userId,
      isDeleted: false,
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
    };
    const response = await this.golistService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: IGolist = {
      ...req.body,
      createdBy: req.locals.auth?.userId,
    };
    const response = await this.golistService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.golistService.show(id, [
      {
        path: "serviceProviders",
        model: "Users",
        select: "username firstName lastName email phone",
      },
      {
        path: "taskInterests",
        model: "Service",
        // select: "username firstName lastName email phone",
      },
    ]);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IGolist> = { ...req.body };

    const response = await this.golistService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.golistService.delete(id);
    return res.status(response.code).json(response);
  };
}
export default GolistController;
