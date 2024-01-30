import {
  ISubscription,
  ISubscriptionDoc,
} from "../../../database/interfaces/subscription.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ISubscriptionRepository
  extends IBaseRepository<ISubscription, ISubscriptionDoc> {}
