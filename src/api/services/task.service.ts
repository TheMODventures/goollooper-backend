import { ObjectId } from "bson";
import { Request } from "express";
import { FilterQuery } from "mongoose";
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
import { CalendarRepository } from "../repository/calendar/calendar.repository";
import { ChatRepository } from "../repository/chat/chat.repository";
import { UserRepository } from "../repository/user/user.repository";
import { ITask, ITaskPayload } from "../../database/interfaces/task.interface";
import { IGolist } from "../../database/interfaces/golist.interface";
import {
  ECALENDARTaskType,
  ENOTIFICATION_TYPES,
  ETaskUserStatus,
  TaskType,
} from "../../database/interfaces/enums";
import { ICalendar } from "../../database/interfaces/calendar.interface";
import { IUser } from "../../database/interfaces/user.interface";
import { UploadHelper } from "../helpers/upload.helper";
import { ModelHelper } from "../helpers/model.helper";
import NotificationService, {
  NotificationParams,
} from "./notification.service";

class TaskService {
  private taskRepository: TaskRepository;
  private golistRepository: GolistRepository;
  private calendarRepository: CalendarRepository;
  private notificationService: NotificationService;
  private uploadHelper: UploadHelper;
  private chatRepository: ChatRepository;
  private userRepository: UserRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.golistRepository = new GolistRepository();
    this.calendarRepository = new CalendarRepository();
    this.chatRepository = new ChatRepository();
    this.userRepository = new UserRepository();
    this.notificationService = new NotificationService();

    this.uploadHelper = new UploadHelper("task");
  }

  getCount = async (filter?: FilterQuery<ITask>): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.taskRepository.getCount(filter);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        getDocCount.toString()
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

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
        {
          $lookup: {
            from: "users",
            localField: "postedBy",
            foreignField: "_id",
            as: "postedBy",
            pipeline: [
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  username: 1,
                  email: 1,
                  profileImage: 1,
                  ratingCount: 1,
                  averageRating: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$postedBy",
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

  myTasks = async (
    page: number,
    limit: number,
    type: string,
    user: string
  ): Promise<ApiResponse> => {
    try {
      const match: any = { isDeleted: false };
      const userId = new ObjectId(user);
      if (type === "accepted") {
        match["goList.serviceProviders"] = userId;
      } else {
        match.postedBy = { $eq: userId };
      }

      const data = await this.taskRepository.getAllWithPagination(
        match,
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
        ModelHelper.populateData(
          "goList.serviceProviders.user",
          ModelHelper.userSelect,
          "Users"
        ),
        ModelHelper.populateData(
          "goList.taskInterests",
          "title type parent",
          "Service"
        ),
        ModelHelper.populateData("postedBy", ModelHelper.userSelect, "Users"),
        ModelHelper.populateData("users.user", ModelHelper.userSelect, "Users"),
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

  create = async (
    payload: ITaskPayload,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      const userId = req?.locals?.auth?.userId!;
      payload.postedBy = userId;
      if (
        req &&
        _.isArray(req.files) &&
        req.files?.length &&
        req.files?.find((file) => file.fieldname === "media")
      ) {
        const image = req.files?.filter((file) => file.fieldname === "media");
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

      if (payload.type !== TaskType.megablast) {
        const goList: IGolist | null = await this.golistRepository.getById(
          payload.goList as string
        );
        if (!goList)
          return ResponseHelper.sendResponse(404, "GoList not found");
        payload.goList = {
          goListId: payload.goList as string,
          title: goList.title,
          serviceProviders: payload.goListServiceProviders?.map((user) => ({
            user: user as ObjectId,
            status: ETaskUserStatus.STANDBY,
          })),
          taskInterests: goList.taskInterests,
        };
        payload.pendingCount = payload.goListServiceProviders.length;
      }

      if (payload.subTasks?.length) {
        for (let i = 0; i < payload.subTasks.length; i++) {
          const element = payload.subTasks[i];
          if (
            req &&
            _.isArray(req.files) &&
            req.files.length &&
            req.files?.find(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            )
          ) {
            const image = req.files?.filter(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            );

            let path: any = await this.uploadHelper.uploadFileFromBuffer(image);
            element.media = path[0];
          }
        }
      }
      const data = await this.taskRepository.create<ITask>(payload);

      if (
        payload.type === TaskType.normal &&
        payload.goListServiceProviders.length
      ) {
        payload.goListServiceProviders.map(async (user) => {
          await this.calendarRepository.create({
            user: user,
            task: data._id,
            date: data.date,
          } as ICalendar);
        });
      }
      await this.calendarRepository.create({
        user: payload.postedBy as string,
        task: data._id,
        date: data.date,
      } as ICalendar);
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string,
    dataset: Partial<ITaskPayload>,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      let taskResponse = await this.taskRepository.getOne<ITask>({
        _id: _id,
      });

      if (
        req &&
        _.isArray(req.files) &&
        req.files?.length &&
        req.files?.find((file) => file.fieldname === "media")
      ) {
        const image = req.files?.filter((file) => file.fieldname === "media");
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
          serviceProviders: dataset.goListServiceProviders?.map((user) => ({
            user: user as ObjectId,
            status: ETaskUserStatus.STANDBY,
          })) as any,
          taskInterests: goList.taskInterests,
        };
      }

      if (dataset.subTasks?.length) {
        for (let i = 0; i < dataset.subTasks.length; i++) {
          const element = dataset.subTasks[i];
          if (
            req &&
            _.isArray(req.files) &&
            req.files.length &&
            req.files?.find(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            )
          ) {
            const image = req.files?.filter(
              (file) =>
                file.fieldname === `subTasks[${i}][subTaskMedia]`.toString()
            );

            let path: any = await this.uploadHelper.uploadFileFromBuffer(image);
            element.media = path[0];
          }
        }
      }

      const response = await this.taskRepository.updateById<ITask>(
        _id,
        dataset
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      if (
        taskResponse?.type === TaskType.event &&
        dataset.date &&
        taskResponse.date !== dataset.date
      )
        await this.calendarRepository.updateMany({ task: response._id }, {
          date: response.date,
        } as ICalendar);
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
      await this.calendarRepository.deleteMany({
        task: response._id,
      });
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  requestToAdded = async (_id: string, user: string) => {
    try {
      const isExist = await this.taskRepository.exists({
        _id: new ObjectId(_id),
        "users.user": new ObjectId(user),
      });
      if (isExist)
        return ResponseHelper.sendResponse(422, "You are already in this task");
      const response: ITask | null = await this.taskRepository.updateById(_id, {
        $addToSet: { users: { user } },
        $inc: { pendingCount: 1 },
      });

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      let userData: IUser | null = await this.userRepository.getById(
        user,
        undefined,
        "firstName"
      );
      this.notificationService.createAndSendNotification({
        senderId: user,
        receiverId: response.postedBy,
        type: ENOTIFICATION_TYPES.TASK_REQUEST,
        data: { task: response?._id?.toString() },
        ntitle: "Task Request",
        nbody: `${userData?.firstName} has requested to be added to the task`,
      } as NotificationParams);

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  toggleRequest = async (
    _id: string,
    loggedInUser: string,
    user: string,
    status: number,
    type: string
  ) => {
    try {
      let isExist;
      if (type === "goList") {
        isExist = await this.taskRepository.exists({
          _id: new ObjectId(_id),
          "goList.serviceProviders": {
            $elemMatch: { user: new ObjectId(user), status },
          },
        });
      } else {
        isExist = await this.taskRepository.exists({
          _id: new ObjectId(_id),
          users: { $elemMatch: { user: new ObjectId(user), status } },
        });
      }
      if (isExist)
        return ResponseHelper.sendResponse(422, `Status is already ${status}`);
      const updateCount: any = { $inc: {} };
      if (status == ETaskUserStatus.REJECTED)
        updateCount["$inc"].pendingCount = -1;
      if (status == ETaskUserStatus.ACCEPTED) {
        updateCount["$inc"].pendingCount = -1;
        updateCount["$inc"].acceptedCount = 1;
      }
      let response;
      if (type === "goList") {
        response = await this.taskRepository.updateByOne<ITask>(
          { _id: new ObjectId(_id) },
          {
            $set: { "goList.serviceProviders.$[providers].status": status },
            ...updateCount,
          },
          { arrayFilters: [{ "providers.user": new ObjectId(user) }] }
        );
      } else {
        response = await this.taskRepository.updateByOne<ITask>(
          { _id: new ObjectId(_id) },
          {
            $set: { "users.$[users].status": status },
            ...updateCount,
          },
          { arrayFilters: [{ "users.user": new ObjectId(user) }] }
        );
      }

      let loggedInUserData: IUser | null = await this.userRepository.getById(
        loggedInUser,
        undefined,
        "firstName"
      );
      let chatId;
      if (response && status == ETaskUserStatus.ACCEPTED) {
        await this.calendarRepository.create({
          user,
          task: response._id,
          date: response.date ?? "2024-11-11",
          type: ECALENDARTaskType.accepted,
        } as ICalendar);
        this.notificationService.createAndSendNotification({
          senderId: response.postedBy,
          receiverId: user,
          type: ENOTIFICATION_TYPES.TASK_ACCEPTED,
          data: { task: response._id?.toString() },
          ntitle: "Task Accepted",
          nbody: `${loggedInUserData?.firstName} accepted your task request`,
        } as NotificationParams);
        chatId = await this.chatRepository.addChatForTask({
          user: loggedInUser,
          task: _id as string,
          participant: user,
          groupName: response?.title,
          noOfServiceProvider: response.noOfServiceProvider,
        });
      } else if (response && status == ETaskUserStatus.REJECTED) {
        await this.calendarRepository.deleteMany({
          user: new ObjectId(user),
          task: response._id,
        });
        this.notificationService.createAndSendNotification({
          senderId: response.postedBy,
          receiverId: user,
          type: ENOTIFICATION_TYPES.TASK_REJECTED,
          data: { task: response._id?.toString() },
          ntitle: "Task Rejected",
          nbody: `${loggedInUserData?.firstName} rejected your task request`,
        } as NotificationParams);
      }

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_UPDATION_PASSED, {
        response,
        chat: chatId,
      });
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default TaskService;
