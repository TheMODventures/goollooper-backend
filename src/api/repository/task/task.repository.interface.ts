import { ITask, ITaskDoc } from "../../../database/interfaces/task.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ITaskRepository extends IBaseRepository<ITask, ITaskDoc> {}
