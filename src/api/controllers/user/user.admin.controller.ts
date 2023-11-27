import { Request, Response } from "express";
import moment from "moment";

import UserService from "../../services/user.service";
import { IUser } from "../../../database/interfaces/user.interface";

class UserController {
  protected userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const limitNow = limit ? limit : 10;
    const response = await this.userService.index(
      Number(page),
      Number(limitNow)
    );
    return res.status(response.code).json(response);
  };

  trashIndex = async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const limitNow = limit ? limit : 10;
    const response = await this.userService.trashIndex(
      Number(page),
      Number(limitNow)
    );
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { _id } = req.params;
    const response = await this.userService.show(_id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { _id } = req.params;
    const dataset: Partial<IUser> = { ...req.body };
    const response = await this.userService.update(_id, dataset);
    return res.status(response.code).json(response);
  };

  trash = async (req: Request, res: Response) => {
    const { _id } = req.params;
    const dataset: Partial<IUser> = {
      deletedAt: moment(),
    };
    const response = await this.userService.update(_id, dataset);

    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { _id } = req.params;
    const response = await this.userService.delete(_id);
    return res.status(response.code).json(response);
  };

  restore = async (req: Request, res: Response) => {
    const { _id } = req.params;
    const dataset: Partial<IUser> = {
      deletedAt: null,
    };
    const response = await this.userService.update(_id, dataset);

    return res.status(response.code).json(response);
  };
}

export default UserController;
