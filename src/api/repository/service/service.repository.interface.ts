import {
  IService,
  IServiceDoc,
} from "../../../database/interfaces/service.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IServiceRepository
  extends IBaseRepository<IService, IServiceDoc> {}
