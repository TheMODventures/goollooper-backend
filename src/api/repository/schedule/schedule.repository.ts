import mongoose from "mongoose";

import {
  ISchedule,
  IScheduleDoc,
  ISlot,
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

  async updateCollidingSchedules(
    scheduleStartDate: Date,
    slots: ISlot[],
    userId: mongoose.Types.ObjectId
  ): Promise<null> {
    // const pipelineStage: PipelineStage[] = [
    //   {
    //     $match: {
    //       date: scheduleStartDate,
    //       user: new mongoose.Types.ObjectId(userId),
    //       $or: slots.map((slot) => ({
    //         $and: [
    //           { "slots.startTime": { $lte: slot.endTime } },
    //           { "slots.endTime": { $gte: slot.startTime } },
    //         ],
    //       })),
    //     },
    //   },
    //   {
    //     $set: {
    //       isActive: false,
    //     },
    //   },
    // ];

    // let updatedUser = await this.model.aggregate(pipelineStage).exec();
    const filter = {
      date: scheduleStartDate,
      user: new mongoose.Types.ObjectId(userId),
      isActive: true,
      $or: slots.map((slot) => ({
        $and: [
          { "slots.startTime": { $lte: slot.endTime } },
          { "slots.endTime": { $gte: slot.startTime } },
        ],
      })),
    };
    await this.model.updateMany(filter, { isActive: false });

    return null;
  }
}
