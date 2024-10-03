import {
  IIndustry,
  IIndustryDoc,
} from "../../../database/interfaces/industry.interface";
import { Industry } from "../../../database/models/industry.model";
import { BaseRepository } from "../base.repository";
import { IIndustryRepository } from "./industry.repository.interface";

export class IndustryRepository
  extends BaseRepository<IIndustry, IIndustryDoc>
  implements IIndustryRepository
{
  constructor() {
    super(Industry);
  }
}
