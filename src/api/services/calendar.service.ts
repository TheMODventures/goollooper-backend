import mongoose, { FilterQuery, ObjectId } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import { ICalendar } from "../../database/interfaces/calendar.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { CalendarRepository } from "../repository/calendar/calendar.repository";
import { ModelHelper } from "../helpers/model.helper";

class CalendarService {
  private calendarRepository: CalendarRepository;

  constructor() {
    this.calendarRepository = new CalendarRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<ICalendar>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.calendarRepository.getCount(filter);
      const response = await this.calendarRepository.getAll<ICalendar>(
        filter,
        "",
        "",
        {
          createdAt: "desc",
        },
        [
          ModelHelper.populateData(
            "task",
            "title description postedBy",
            "Task",
            [
              ModelHelper.populateData(
                "postedBy",
                ModelHelper.userSelect,
                "Users"
              ),
            ]
          ),
        ],
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

  create = async (payload: ICalendar): Promise<ApiResponse> => {
    try {
      const data = await this.calendarRepository.create<ICalendar>(payload);
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
      };
      const response = await this.calendarRepository.getOne<ICalendar>(filter);
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

  update = async (
    _id: string | mongoose.Types.ObjectId,
    dataset: Partial<ICalendar>
  ): Promise<ApiResponse> => {
    try {
      if (!dataset.date)
        return ResponseHelper.sendResponse(422, "Please Provide date");

      const response = await this.calendarRepository.updateById<ICalendar>(
        _id as string,
        dataset
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.calendarRepository.delete<ICalendar>({ _id });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default CalendarService;
