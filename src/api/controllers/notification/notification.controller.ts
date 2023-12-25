import { Request, Response } from "express";
import { FilterQuery } from "mongoose";

import NotificationService from "../../services/notification.service";

import { INotification } from "../../../database/interfaces/notification.interface";
import { ModelHelper } from "../../helpers/model.helper";

class NotificationController {
  protected notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page = 1 } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<INotification> = {
      // name: { $regex: name, $options: "i" },
      receiver: req.locals.auth?.userId,
    };
    const response = await this.notificationService.index(
      Number(page),
      Number(limitNow),
      filter,
      [
        ModelHelper.populateData("sender", ModelHelper.userSelect, "Users"),
        ModelHelper.populateData(
          "data.serviceProvider",
          ModelHelper.userSelect,
          "Users",
          [
            ModelHelper.populateData(
              "subscription.subscription",
              ModelHelper.subscriptionSelect
            ),
          ]
        ),
      ]
    );
    response.data.result = response.data.result.map((e: any) => {
      return {
        ...e,
        content: (e.content as string)
          .replace("#sender", e.sender?.firstName ?? e.sender?.email ?? "")
          .replace("#receiver", ""),
      };
    });
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const payload: INotification = { ...req.body };
    const response = await this.notificationService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.notificationService.show(id);
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<INotification> = { ...req.body };

    const response = await this.notificationService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.notificationService.delete(id);
    return res.status(response.code).json(response);
  };
}

export default NotificationController;
