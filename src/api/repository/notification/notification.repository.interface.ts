import {
  INotification,
  INotificationDoc,
} from "../../../database/interfaces/notification.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface INotificationRepository
  extends IBaseRepository<INotification, INotificationDoc> {}
