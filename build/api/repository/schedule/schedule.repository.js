"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schedule_model_1 = require("../../../database/models/schedule.model");
const base_repository_1 = require("../base.repository");
class ScheduleRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(schedule_model_1.Schedule);
    }
    async updateCollidingSchedules(scheduleStartDate, slots, userId) {
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
            user: new mongoose_1.default.Types.ObjectId(userId),
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
exports.ScheduleRepository = ScheduleRepository;
//# sourceMappingURL=schedule.repository.js.map