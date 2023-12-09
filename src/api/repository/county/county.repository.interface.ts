import {
  ICounty,
  ICountyDoc,
} from "../../../database/interfaces/county.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ICountyRepository
  extends IBaseRepository<ICounty, ICountyDoc> {}
