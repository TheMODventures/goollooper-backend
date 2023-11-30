import {
  ISubscription,
  ISubscriptionDoc,
} from "../../../database/interfaces/subscription.interface";
import { Subscription } from "../../../database/models/subscription.model";
import { BaseRepository } from "../base.repository";
import { ISubscriptionRepository } from "./subscription.repository.interface";

export class SubscriptionRepository
  extends BaseRepository<ISubscription, ISubscriptionDoc>
  implements ISubscriptionRepository
{
  constructor() {
    super(Subscription);
  }
}
