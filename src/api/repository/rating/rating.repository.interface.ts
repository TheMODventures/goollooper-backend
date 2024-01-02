import {
  IRating,
  IRatingDoc,
} from "../../../database/interfaces/rating.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IRatingRepository
  extends IBaseRepository<IRating, IRatingDoc> {}
