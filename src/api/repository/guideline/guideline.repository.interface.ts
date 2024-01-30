import {
  IGuideline,
  IGuidelineDoc,
} from "../../../database/interfaces/guideline.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IGuidelineRepository
  extends IBaseRepository<IGuideline, IGuidelineDoc> {}
