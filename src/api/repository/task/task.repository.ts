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

  getOneByFilter = async (filter: FilterQuery<ITask>) => {
    const response = await this.model.findOne<ITask>(filter);
    return response;
  };
}
