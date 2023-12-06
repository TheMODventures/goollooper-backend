import {
  IGolist,
  IGolistDoc,
} from "../../../database/interfaces/golist.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IGolistRepository
  extends IBaseRepository<IGolist, IGolistDoc> {}
