import { FilterQuery } from "mongoose";
import { Request, Response } from "express";

import { IGolist } from "../../../database/interfaces/golist.interface";
import GolistService from "../../services/golist.service";
import { EList } from "../../../database/interfaces/enums";
import { IUser } from "../../../database/interfaces/user.interface";
import UserService from "../../services/user.service";

class GolistController {
  protected golistService: GolistService;
  protected userService: UserService;

  constructor() {
    this.golistService = new GolistService();
    this.userService = new UserService();
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
    if (type) filter.type = type;
    const response = await this.golistService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const user = req.locals.auth?.userId;
    const payload: IGolist = {
      ...req.body,
      createdBy: user,
    };
    if (payload.type === EList.myList) {
      payload.title = "My List";
      const phoneContacts = req.body.phoneContacts as string[];
      const users = await this.userService.index(1, 10000, {
        _id: { $ne: payload.createdBy },
        phone: { $in: phoneContacts },
      });
      const mylist = await this.golistService.index(1, 1, {
        type: EList.myList,
        createdBy: user,
      });
      if (mylist.total && mylist.total !== 0) {
        const item = mylist.data[0] as IGolist;
        const response = await this.golistService.update(
          item._id?.toString() ?? "",
          {
            serviceProviders: users.data.map((e: IUser) => e._id),
            createdBy: user,
          }
        );
        return res.status(response.code).json(response);
      }
      if (users.status)
        payload.serviceProviders = users.data.map((e: IUser) => e._id);
    }
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

  showMyList = async (req: Request, res: Response) => {
    const data = await this.golistService.index(1, 1, {
      createdBy: req.locals.auth?.userId,
      type: EList.myList,
    });
    if (data.data?.length === 0)
      return res.status(data.code).json({ ...data, msg: "Not found" });
    const response = await this.golistService.show(
      data.data[0]._id.toString(),
      [
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
      ]
    );
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

  getNearestServiceProviders = async (req: Request, res: Response) => {
    const {
      limit,
      page,
      latitude,
      longitude,
      zipCode,
      taskInterests = [],
      subscription = "",
    } = req.query;
    const limitNow = limit ? limit : 10;
    const coordinates = [Number(longitude), Number(latitude)];
    const response = await this.golistService.getNearestServiceProviders(
      Number(page),
      Number(limitNow),
      req.locals.auth?.userId,
      taskInterests as string[],
      subscription?.toString(),
      coordinates,
      zipCode?.toString()
    );
    return res.status(response.code).json(response);
  };
}
export default GolistController;
