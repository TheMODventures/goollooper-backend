import {
  ISchedule,
  IScheduleDoc,
} from "../../../database/interfaces/schedule.interface";
import { Schedule } from "../../../database/models/schedule.model";
import { BaseRepository } from "../base.repository";
import { IScheduleRepository } from "./schedule.repository.interface";

export class ScheduleRepository
  extends BaseRepository<ISchedule, IScheduleDoc>
  implements IScheduleRepository
{
  constructor() {
    super(Schedule);
  }
}
