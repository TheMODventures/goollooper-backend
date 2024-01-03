import { ObjectId } from "mongodb";
import { Request } from "express";
import _ from "lodash";

import { ResponseHelper } from "../helpers/reponseapi.helper";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { TaskRepository } from "../repository/task/task.repository";
import { GolistRepository } from "../repository/golist/golist.repository";
import { ITask } from "../../database/interfaces/task.interface";
import { UploadHelper } from "../helpers/upload.helper";
import { IGolist } from "../../database/interfaces/golist.interface";

class TaskService {
  private taskRepository: TaskRepository;
  private golistRepository: GolistRepository;
  private uploadHelper: UploadHelper;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.golistRepository = new GolistRepository();

    this.uploadHelper = new UploadHelper("task");
  }

  index = async (
    taskInterests: string[],
    user: string,
    page: number,
    limit: number
  ): Promise<ApiResponse> => {
    try {
      const match: any = { postedBy: { $ne: new ObjectId(user) } };
      match.isDeleted = false;
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
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
        isDeleted: false,
      };
      const response = await this.taskRepository.getOne<ITask>(filter, "", "", [
        {
          path: "goList.serviceProviders",
          model: "Users",
          select: "firstName lastName userName email",
        },
        {
          path: "goList.taskInterests",
          model: "Service",
          select: "title type parent",
        },
      ]);
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

  create = async (payload: ITask, req?: Request): Promise<ApiResponse> => {
    try {
      if (req?.file && req.file?.fieldname === "media") {
        const image = [req.file];
        let path = await this.uploadHelper.uploadFileFromBuffer(image);
        payload.media = path[0];
      }

      if (payload.myList?.length && !payload.goList)
        return ResponseHelper.sendResponse(422, "Provide golist");

      if (payload.myList?.length) {
        await this.golistRepository.updateById(payload.goList as string, {
          $addToSet: {
            serviceProviders: { $each: payload.myList },
          },
        });
      }

      if (payload.goList) {
        const goList: IGolist | null = await this.golistRepository.getById(
          payload.goList as string
        );
        if (!goList)
          return ResponseHelper.sendResponse(404, "GoList not found");
        payload.goList = {
          goListId: payload.goList as string,
          title: goList.title,
          serviceProviders: goList.serviceProviders,
          taskInterests: goList.taskInterests,
        };
      }

      const data = await this.taskRepository.create<ITask>(payload);
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string,
    dataset: Partial<ITask>,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      let taskResponse = await this.taskRepository.getOne<ITask>({
        _id: _id,
      });

      if (req?.file && req.file?.fieldname === "media") {
        const image = [req.file];
        let path = await this.uploadHelper.uploadFileFromBuffer(image);
        dataset.media = path[0];
      }

      if (dataset?.media && taskResponse?.media) {
        this.uploadHelper.deleteFile(taskResponse?.media);
      }

      if (dataset.myList?.length && !dataset.goList)
        return ResponseHelper.sendResponse(422, "Provide golist");

      if (dataset.myList?.length) {
        await this.golistRepository.updateById(dataset.goList as string, {
          $addToSet: {
            serviceProviders: { $each: dataset.myList },
          },
        });
      }

      if (dataset.goList) {
        const goList: IGolist | null = await this.golistRepository.getById(
          dataset.goList as string
        );
        if (!goList)
          return ResponseHelper.sendResponse(404, "GoList not found");
        dataset.goList = {
          goListId: dataset.goList as string,
          title: goList.title,
          serviceProviders: goList.serviceProviders,
          taskInterests: goList.taskInterests,
        };
      }

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
      const response = await this.taskRepository.updateById<ITask>(_id, {
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
}

export default TaskService;
