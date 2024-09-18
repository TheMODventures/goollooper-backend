import {
  IWorker,
  IWorkerDoc,
} from "../../../database/interfaces/worker.interface";
import { Worker } from "../../../database/models/worker.model";
import { BaseRepository } from "../base.repository";
import { IWorkerRepository } from "./worker.repository.interface";

export class WorkerRepository
  extends BaseRepository<IWorker, IWorkerDoc>
  implements IWorkerRepository
{
  constructor() {
    super(Worker);
  }
}
