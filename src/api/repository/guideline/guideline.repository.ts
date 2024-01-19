import { FilterQuery } from "mongoose";

import {
  IGuideline,
  IGuidelineDoc,
} from "../../../database/interfaces/guideline.interface";
import { Guideline } from "../../../database/models/guideline.model";
import { BaseRepository } from "../base.repository";
import { IGuidelineRepository } from "./guideline.repository.interface";

export class GuidelineRepository
  extends BaseRepository<IGuideline, IGuidelineDoc>
  implements IGuidelineRepository
{
  constructor() {
    super(Guideline);
  }

  getOneByFilter = async (filter: FilterQuery<IGuideline>) => {
    const response = await this.model.findOne<IGuideline>(filter);
    return response;
  };
}
