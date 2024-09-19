import {
  IWorker,
  IWorkerDoc,
} from "../../../database/interfaces/worker.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IWorkerRepository
  extends IBaseRepository<IWorker, IWorkerDoc> {}
