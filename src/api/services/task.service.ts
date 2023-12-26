import { ObjectId } from "mongodb";

import { ResponseHelper } from "../helpers/reponseapi.helper";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { TaskRepository } from "../repository/task/task.repository";
import { ITask } from "../../database/interfaces/task.interface";

class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  index = async (
    taskInterests: string[],
    user: string,
    page: number,
    limit: number
  ): Promise<ApiResponse> => {
    try {
      const match: any = { postedBy: { $ne: new ObjectId(user) } };
      if (taskInterests?.length > 0)
        match.taskInterests = {
          $in: taskInterests.map((e) => new ObjectId(e)),
        };
      const query = [
        {
          $match: match,
        },
      ];
      const data = await this.taskRepository.getAllWithAggregatePagination(
        query,
        undefined,
        undefined,
        { createdAt: -1 },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_LIST_PASSED, data);
    } catch (err) {
      return ResponseHelper.sendResponse(500, (err as Error).message);
      //   throw new Error("Something went wrong while creating token");
    }
  };

  create = async (payload: ITask): Promise<ApiResponse> => {
    try {
      const data = await this.taskRepository.create<ITask>(payload);
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
      const response = await this.taskRepository.getOne<ITask>(filter);
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
    _id: string,
    dataset: Partial<ITask>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.taskRepository.updateById<ITask>(
        _id,
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
      const response = await this.taskRepository.delete<ITask>({ _id });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default TaskService;
