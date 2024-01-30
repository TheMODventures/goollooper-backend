import { FilterQuery } from "mongoose";

import { ICity, ICityDoc } from "../../../database/interfaces/city.interface";
import { City } from "../../../database/models/city.model";
import { BaseRepository } from "../base.repository";
import { ICityRepository } from "./city.repository.interface";

export class CityRepository
  extends BaseRepository<ICity, ICityDoc>
  implements ICityRepository
{
  constructor() {
    super(City);
  }

  getOneByFilter = async (filter: FilterQuery<ICity>) => {
    const response = await this.model.findOne<ICity>(filter);
    return response;
  };
}
