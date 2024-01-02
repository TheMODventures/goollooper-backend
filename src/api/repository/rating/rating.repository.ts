import { FilterQuery } from "mongoose";

import { BaseRepository } from "../base.repository";
import { IRatingRepository } from "./rating.repository.interface";
import {
  IRating,
  IRatingDoc,
} from "../../../database/interfaces/rating.interface";
import { Rating } from "../../../database/models/rating.model";

export class RatingRepository
  extends BaseRepository<IRating, IRatingDoc>
  implements IRatingRepository
{
  constructor() {
    super(Rating);
  }

  getOneByFilter = async (filter: FilterQuery<IRating>) => {
    const response = await this.model.findOne<IRating>(filter);
    return response;
  };
}
