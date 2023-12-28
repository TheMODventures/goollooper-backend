import mongoose, { FilterQuery, PipelineStage } from "mongoose";

import {
  Days,
  EUserLocationType,
  EUserRole,
  Repetition,
  RepetitionEvery,
  Subscription,
} from "../../database/interfaces/enums";
import {
  IUser,
  IUserWithSchedule,
} from "../../database/interfaces/user.interface";
import { ISubscription } from "../../database/interfaces/subscription.interface";
import { UserRepository } from "../repository/user/user.repository";
import { SubscriptionRepository } from "../repository/subscription/subscription.repository";
import { ScheduleRepository } from "../repository/schedule/schedule.repository";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { ISchedule } from "../../database/interfaces/schedule.interface";
import { DateHelper } from "../helpers/date.helper";

class UserService {
  private userRepository: UserRepository;
  private subscriptionRepository: SubscriptionRepository;
  private scheduleRepository: ScheduleRepository;
  private dateHelper: DateHelper;

  constructor() {
    this.userRepository = new UserRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.scheduleRepository = new ScheduleRepository();

    this.dateHelper = new DateHelper();
  }

  getByFilter = async (filter: FilterQuery<IUser>): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.getOne<IUser>(filter);
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IUser>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.userRepository.getCount(filter);
      const response = await this.userRepository.getAll<IUser>(
        filter,
        "",
        "",
        {
          createdAt: "desc",
        },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  list = async (selectField: string) => {
    try {
      const filter = {
        role: EUserRole.user,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
      };
      const response = await this.userRepository.getAll<IUser>(
        filter,
        undefined,
        selectField
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        role: EUserRole.user,
        _id: _id,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
      };
      const response = await this.userRepository.getOne<IUser>(filter, "", "", [
        {
          path: "volunteer.service",
          model: "Service",
          select: "title subServices",
        },
        {
          path: "services.service",
          model: "Service",
          select: "title subServices",
        },
        {
          path: "subscription.subscription",
          model: "Subscription",
        },
      ]);

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }

      const schedules = await this.scheduleRepository.getAll({ user: _id });
      const res = { ...response, schedule: schedules };
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_SHOW_PASSED, res);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string | mongoose.Types.ObjectId,
    dataset: Partial<IUserWithSchedule>
  ): Promise<ApiResponse> => {
    try {
      // checking if subscription is bsp then location should be local
      if (dataset.subscription?.subscription) {
        let subscription =
          await this.subscriptionRepository.getById<ISubscription>(
            dataset.subscription.subscription
          );

        if (
          subscription &&
          subscription.name.toLowerCase() === Subscription.bsl &&
          dataset?.locationType !== EUserLocationType.local
        )
          return ResponseHelper.sendResponse(
            422,
            "Location should be local while subscribing to BSL"
          );
      }

      // checking if location is local then all location details should be provided
      if (
        dataset.locationType &&
        dataset.locationType === EUserLocationType.local &&
        (!dataset.location || !dataset.location.length)
      ) {
        return ResponseHelper.sendResponse(422, "Provide all location details");
      } else if (
        dataset.locationType &&
        dataset.locationType === EUserLocationType.local &&
        dataset.location &&
        dataset.location.length
      ) {
        for (let i = 0; i < dataset.location.length; i++) {
          const element = dataset.location[i];
          if (
            element.coordinates.length < 2 ||
            !element.state ||
            !element.city ||
            !element.county ||
            (dataset.zipCode && !dataset.zipCode.length)
          ) {
            return ResponseHelper.sendResponse(
              422,
              "Provide all location details"
            );
          }
          dataset.location[i].coordinates?.map((e) => parseFloat(e.toString()));
          dataset.location[i].type ??= "Point";
          if (element.isSelected)
            dataset.selectedLocation = dataset.location[i];
        }
      }

      // schedule creation
      if (dataset.schedule) {
        let schedule = dataset.schedule;
        let noOfDays: number = 60;
        const daysInWeek = 7;
        let startDate = new Date(schedule.startDate);
        const currentDate: Date = new Date();
        let daysRemaining: number =
          noOfDays -
          Math.ceil(
            (startDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
          );

        if (schedule.repetition === Repetition.none) {
          const scheduleStartDate = new Date(startDate);
          scheduleStartDate.setDate(startDate.getDate());

          await this.scheduleRepository.updateCollidingSchedules(
            scheduleStartDate,
            schedule.slots,
            _id as mongoose.Types.ObjectId
          );

          await this.scheduleRepository.create<ISchedule>({
            date: scheduleStartDate,
            day: this.dateHelper.getDayOfWeek(scheduleStartDate) as Days,
            slots: schedule.slots,
            user: _id as mongoose.Types.ObjectId,
          });
        } else if (schedule.repetition === Repetition.day) {
          for (let i = 0; i < daysRemaining; i++) {
            const scheduleStartDate = new Date(startDate);
            scheduleStartDate.setDate(startDate.getDate() + i);

            await this.scheduleRepository.updateCollidingSchedules(
              scheduleStartDate,
              schedule.slots,
              _id as mongoose.Types.ObjectId
            );

            await this.scheduleRepository.create<ISchedule>({
              date: scheduleStartDate,
              day: this.dateHelper.getDayOfWeek(scheduleStartDate) as Days,
              slots: schedule.slots,
              user: _id as mongoose.Types.ObjectId,
            });
          }
        } else if (schedule.repetition === Repetition.week) {
          const noOfWeeks = Math.ceil(daysRemaining / daysInWeek);

          for (let i = 0; i < noOfWeeks; i++) {
            const scheduleStartDate = new Date(startDate);
            scheduleStartDate.setDate(startDate.getDate() + i * daysInWeek);

            await this.scheduleRepository.updateCollidingSchedules(
              scheduleStartDate,
              schedule.slots,
              _id as mongoose.Types.ObjectId
            );

            await this.scheduleRepository.create<ISchedule>({
              date: scheduleStartDate,
              day: this.dateHelper.getDayOfWeek(scheduleStartDate) as Days,
              slots: schedule.slots,
              user: _id as mongoose.Types.ObjectId,
            });
          }
        } else if (schedule.repetition === Repetition.month) {
          const scheduleStartDate = new Date(startDate);

          while (daysRemaining > 0) {
            await this.scheduleRepository.updateCollidingSchedules(
              scheduleStartDate,
              schedule.slots,
              _id as mongoose.Types.ObjectId
            );

            await this.scheduleRepository.create<ISchedule>({
              date: scheduleStartDate,
              day: this.dateHelper.getDayOfWeek(scheduleStartDate) as Days,
              slots: schedule.slots,
              user: _id as mongoose.Types.ObjectId,
            });

            // Move to the next month
            scheduleStartDate.setMonth(scheduleStartDate.getMonth() + 1);

            // Subtract the actual number of days in the month from the remaining days
            daysRemaining -= this.dateHelper.getDaysInMonth(scheduleStartDate);
          }
        } else if (schedule.repetition === Repetition.year) {
          const scheduleStartDate = new Date(startDate);

          while (daysRemaining > 0) {
            await this.scheduleRepository.updateCollidingSchedules(
              scheduleStartDate,
              schedule.slots,
              _id as mongoose.Types.ObjectId
            );

            await this.scheduleRepository.create<ISchedule>({
              date: scheduleStartDate,
              day: this.dateHelper.getDayOfWeek(scheduleStartDate) as Days,
              slots: schedule.slots,
              user: _id as mongoose.Types.ObjectId,
            });

            // Move to the next year
            scheduleStartDate.setFullYear(scheduleStartDate.getFullYear() + 1);

            // Subtract the actual number of days in the year from the remaining days
            daysRemaining -= this.dateHelper.getDaysInYear(scheduleStartDate);
          }
        } else if (schedule.repetition === Repetition.custom) {
          if (
            !schedule.repeatsEvery ||
            !schedule.repeatsOn ||
            !schedule.repeatsAfter
          ) {
            return ResponseHelper.sendResponse(
              422,
              "Provide all schedule details required"
            );
          }

          let daysDifference = 0;
          // check if end date is provided
          if (schedule.endDate) {
            daysDifference = this.dateHelper.isDateDifferenceGreaterThan(
              schedule.startDate,
              schedule.endDate
            );
          } else if (schedule.occurrence) {
            let endDate = startDate;
            endDate.setDate(startDate.getDate() + +schedule.occurrence * 7);

            daysDifference = daysDifference =
              this.dateHelper.isDateDifferenceGreaterThan(
                schedule.startDate,
                endDate.toString()
              );
          } else if (!schedule.endDate && !schedule.occurrence) {
            daysDifference = daysRemaining + 1;
          }

          // if schedule is greater than {noOfDays} days
          if (daysDifference > daysRemaining) {
            if (schedule.repeatsEvery === RepetitionEvery.week) {
              const selectedDays = schedule.repeatsOn;
              const noOfWeeks = Math.ceil(daysRemaining / daysInWeek);
              let repeatsAfter = schedule.repeatsAfter || 1;
              for (let i = 0; i < noOfWeeks; i += +repeatsAfter) {
                // iterate through selected days and create schedules
                for (const day of selectedDays) {
                  // calculating next occurrence of the selected day
                  const scheduleStartDate = this.dateHelper.getNextWeekdayByDay(
                    schedule.startDate,
                    day,
                    i
                  );

                  await this.scheduleRepository.updateCollidingSchedules(
                    scheduleStartDate,
                    schedule.slots,
                    _id as mongoose.Types.ObjectId
                  );

                  await this.scheduleRepository.create<ISchedule>({
                    date: scheduleStartDate,
                    day: this.dateHelper.getDayOfWeek(
                      scheduleStartDate
                    ) as Days,
                    slots: schedule.slots,
                    user: _id as mongoose.Types.ObjectId,
                  });
                }
              }
            } else if (schedule.repeatsEvery === RepetitionEvery.month) {
              const selectedDays = schedule.repeatsOn;
              const daysInMonth = this.dateHelper.getDaysInMonth(
                new Date(schedule.startDate)
              );
              const repeatsAfter = schedule.repeatsAfter || 1; // Default to 1 if repeatsAfter is not provided

              // Calculate the number of months needed based on the total number of days
              const totalMonths = Math.ceil(
                daysRemaining / (daysInMonth * +repeatsAfter)
              );

              for (let i = 0; i < totalMonths; i++) {
                // Iterate through selected days and create schedules
                for (const day of selectedDays) {
                  // Calculate the next occurrence of the selected day in the current month
                  const scheduleStartDate =
                    this.dateHelper.getNextMonthdayByDay(
                      schedule.startDate,
                      day,
                      i * +repeatsAfter
                    );

                  await this.scheduleRepository.updateCollidingSchedules(
                    scheduleStartDate,
                    schedule.slots,
                    _id as mongoose.Types.ObjectId
                  );

                  await this.scheduleRepository.create<ISchedule>({
                    date: scheduleStartDate,
                    day: this.dateHelper.getDayOfWeek(
                      scheduleStartDate
                    ) as Days,
                    slots: schedule.slots,
                    user: _id as mongoose.Types.ObjectId,
                  });
                }
              }
            }
          } else {
            // schedule is less than {noOfDays} days
            if (schedule.repeatsEvery === RepetitionEvery.week) {
              const selectedDays = schedule.repeatsOn;
              const noOfWeeks = Math.ceil(daysDifference / daysInWeek);
              let repeatsAfter = schedule.repeatsAfter || 1;
              for (let i = 0; i < noOfWeeks; i += +repeatsAfter) {
                // iterate through selected days and create schedules
                for (const day of selectedDays) {
                  // calculating next occurrence of the selected day
                  const scheduleStartDate = this.dateHelper.getNextWeekdayByDay(
                    schedule.startDate,
                    day,
                    i
                  );

                  await this.scheduleRepository.updateCollidingSchedules(
                    scheduleStartDate,
                    schedule.slots,
                    _id as mongoose.Types.ObjectId
                  );

                  await this.scheduleRepository.create<ISchedule>({
                    date: scheduleStartDate,
                    day: this.dateHelper.getDayOfWeek(
                      scheduleStartDate
                    ) as Days,
                    slots: schedule.slots,
                    user: _id as mongoose.Types.ObjectId,
                  });
                }
              }
            } else if (schedule.repeatsEvery === RepetitionEvery.month) {
              const selectedDays = schedule.repeatsOn;
              const daysInMonth = this.dateHelper.getDaysInMonth(
                new Date(schedule.startDate)
              );
              const repeatsAfter = schedule.repeatsAfter || 1; // Default to 1 if repeatsAfter is not provided

              // Calculate the number of months needed based on the total number of days
              const totalMonths = Math.ceil(
                daysDifference / (daysInMonth * +repeatsAfter)
              );

              for (let i = 0; i < totalMonths; i++) {
                // Iterate through selected days and create schedules
                for (const day of selectedDays) {
                  // Calculate the next occurrence of the selected day in the current month
                  const scheduleStartDate =
                    this.dateHelper.getNextMonthdayByDay(
                      schedule.startDate,
                      day,
                      i * +repeatsAfter
                    );

                  await this.scheduleRepository.updateCollidingSchedules(
                    scheduleStartDate,
                    schedule.slots,
                    _id as mongoose.Types.ObjectId
                  );

                  await this.scheduleRepository.create<ISchedule>({
                    date: scheduleStartDate,
                    day: this.dateHelper.getDayOfWeek(
                      scheduleStartDate
                    ) as Days,
                    slots: schedule.slots,
                    user: _id as mongoose.Types.ObjectId,
                  });
                }
              }
            }
          }
        }
      }

      if (dataset.phoneCode && dataset.phone) {
        dataset.completePhone = dataset.phoneCode + dataset.phone;
      }

      const response = await this.userRepository.updateById<IUserWithSchedule>(
        _id as string,
        dataset
      );

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }

      let userResponse = await this.userRepository.getOne<IUser>(
        {
          _id: _id,
        },
        "",
        "",
        [
          {
            path: "volunteer.service",
            model: "Service",
            select: "title subServices",
          },
          {
            path: "services.service",
            model: "Service",
            select: "title subServices",
          },
          {
            path: "subscription.subscription",
            model: "Subscription",
          },
        ]
      );
      const schedules = await this.scheduleRepository.getAll({ user: _id });
      const res = { ...userResponse, schedule: schedules };

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        res
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  trashIndex = async (page: number, limit = 10): Promise<ApiResponse> => {
    try {
      const filter = {
        role: EUserRole.user,
        $and: [{ deletedAt: { $exists: true } }, { deletedAt: { $ne: null } }],
      };
      const getDocCount = await this.userRepository.getCount(filter);
      const response = await this.userRepository.getAll<IUser>(
        filter,
        "",
        "",
        {
          deletedAt: "desc",
        },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.updateById<IUser>(_id, {
        isDeleted: true,
      });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  getDataByAggregate = async (
    page: number,
    limit = 10,
    pipeline?: PipelineStage[]
  ) => {
    const countPipeline = (await this.userRepository.getDataByAggregate([
      ...(pipeline ?? []),
      { $sort: { distance: -1 } },
      { $count: "totalCount" },
    ])) as any[];
    const response = await this.userRepository.getDataByAggregate([
      ...(pipeline ?? []),
      { $sort: { distance: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    return ResponseHelper.sendSuccessResponse(
      SUCCESS_DATA_LIST_PASSED,
      response,
      countPipeline.length > 0 ? countPipeline[0].totalCount : 0
    );
  };
}

export default UserService;
