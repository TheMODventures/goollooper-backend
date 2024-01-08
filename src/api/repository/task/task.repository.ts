import { FilterQuery } from "mongoose";

import { ITask, ITaskDoc } from "../../../database/interfaces/task.interface";
import { Task } from "../../../database/models/task.model";
import { BaseRepository } from "../base.repository";
import { ITaskRepository } from "./task.repository.interface";

export class TaskRepository
  extends BaseRepository<ITask, ITaskDoc>
  implements ITaskRepository
{
  constructor() {
    super(Task);
  }

  exists = async (filter: FilterQuery<ITask>): Promise<boolean> => {
    return (await Task.exists(filter)) != null;
  };
}
