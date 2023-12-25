import { FilterQuery } from "mongoose";

import { BaseRepository } from "../base.repository";
import { INotificationRepository } from "./notification.repository.interface";
import {
  INotification,
  INotificationDoc,
} from "../../../database/interfaces/notification.interface";
import { Notification } from "../../../database/models/notification.model";

export class NotificationRepository
  extends BaseRepository<INotification, INotificationDoc>
  implements INotificationRepository
{
  constructor() {
    super(Notification);
  }

  getOneByFilter = async (filter: FilterQuery<INotification>) => {
    const response = await this.model.findOne<INotification>(filter);
    return response;
  };
}
