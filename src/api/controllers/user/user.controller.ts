import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import moment from "moment";
import _ from "lodash";

import UserService from "../../services/user.service";
import { IUser } from "../../../database/interfaces/user.interface";
import { EUserRole } from "../../../database/interfaces/enums";
import { UploadHelper } from "../../helpers/upload.helper";

class UserController {
  protected userService: UserService;
  private uploadHelper: UploadHelper;

  constructor() {
    this.userService = new UserService();
    this.uploadHelper = new UploadHelper("user");
  }

  checkUsername = async (req: Request, res: Response) => {
    const filter: FilterQuery<IUser> = {
      username: req.body.username,
      isDeleted: false,
    };
    const response = await this.userService.getByFilter(filter);

    return res
      .status(response.code)
      .json({ available: response.data ? false : true });
  };

  index = async (req: Request, res: Response) => {
    const { limit, page, username = "", email = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IUser> = {
      // role: EUserRole.user,
      email: { $regex: email, $options: "i" },
      isDeleted: false,
    };
    if (username) {
      filter.username = { $regex: username, $options: "i" };
    }
    const response = await this.userService.index(
      Number(page),
      Number(limitNow),
      filter
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
    const { id } = req.params;
    const response = await this.userService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    let data: Partial<IUser> = { ...req.body };

    if (data?.firstName && data?.username) {
      data.isProfileCompleted = true;
    }

    const response = await this.userService.update(id, data, req);
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
