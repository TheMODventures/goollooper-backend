import { FilterQuery } from "mongoose";

import {
  ICounty,
  ICountyDoc,
} from "../../../database/interfaces/county.interface";
import { County } from "../../../database/models/county.model";
import { BaseRepository } from "../base.repository";
import { ICountyRepository } from "./county.repository.interface";

export class CountyRepository
  extends BaseRepository<ICounty, ICountyDoc>
  implements ICountyRepository
{
  constructor() {
    super(County);
  }

  getOneByFilter = async (filter: FilterQuery<ICounty>) => {
    const response = await this.model.findOne<ICounty>(filter);
    return response;
  };
}
