import {
  ISchedule,
  IScheduleDoc,
} from "../../../database/interfaces/schedule.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IScheduleRepository
  extends IBaseRepository<ISchedule, IScheduleDoc> {}
