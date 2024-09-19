import {
  IIndustry,
  IIndustryDoc,
} from "../../../database/interfaces/industry.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IIndustryRepository
  extends IBaseRepository<IIndustry, IIndustryDoc> {}
