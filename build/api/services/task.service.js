"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bson_1 = require("bson");
const lodash_1 = __importDefault(require("lodash"));
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const constant_1 = require("../../constant");
const task_repository_1 = require("../repository/task/task.repository");
const golist_repository_1 = require("../repository/golist/golist.repository");
const calendar_repository_1 = require("../repository/calendar/calendar.repository");
const chat_repository_1 = require("../repository/chat/chat.repository");
const user_repository_1 = require("../repository/user/user.repository");
const enums_1 = require("../../database/interfaces/enums");
const upload_helper_1 = require("../helpers/upload.helper");
const model_helper_1 = require("../helpers/model.helper");
const notification_service_1 = __importDefault(require("./notification.service"));
class TaskService {
    constructor() {
        this.getCount = async (filter) => {
            try {
                const getDocCount = await this.taskRepository.getCount(filter);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, getDocCount.toString());
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.index = async (taskInterests, user, page, limit, title) => {
            try {
                const match = {
                    postedBy: { $ne: new bson_1.ObjectId(user) },
                };
                match.isDeleted = false;
                if (taskInterests?.length > 0)
                    match.taskInterests = {
                        $in: taskInterests.map((e) => new bson_1.ObjectId(e)),
                    };
                if (title) {
                    match.title = { $regex: title, $options: "i" };
                }
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
                const data = await this.taskRepository.getAllWithAggregatePagination(query, undefined, undefined, { createdAt: -1 }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, data);
            }
            catch (err) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, err.message);
            }
        };
        this.myTasks = async (page, limit, type, user) => {
            try {
                const match = { isDeleted: false };
                const userId = new bson_1.ObjectId(user);
                if (type === "accepted") {
                    match["goList.serviceProviders"] = userId;
                }
                else {
                    match.postedBy = { $eq: userId };
                }
                const data = await this.taskRepository.getAllWithPagination(match, undefined, undefined, { createdAt: -1 }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, data);
            }
            catch (err) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, err.message);
            }
        };
        this.show = async (_id) => {
            try {
                const filter = {
                    _id,
                    isDeleted: false,
                };
                const response = await this.taskRepository.getOne(filter, "", "", [
                    model_helper_1.ModelHelper.populateData("goList.serviceProviders.user", model_helper_1.ModelHelper.userSelect, "Users"),
                    model_helper_1.ModelHelper.populateData("goList.taskInterests", "title type parent", "Service"),
                    model_helper_1.ModelHelper.populateData("postedBy", model_helper_1.ModelHelper.userSelect, "Users"),
                    model_helper_1.ModelHelper.populateData("users.user", model_helper_1.ModelHelper.userSelect, "Users"),
                ]);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload, req) => {
            try {
                const userId = req?.locals?.auth?.userId;
                payload.postedBy = userId;
                if (req &&
                    lodash_1.default.isArray(req.files) &&
                    req.files?.length &&
                    req.files?.find((file) => file.fieldname === "media")) {
                    const image = req.files?.filter((file) => file.fieldname === "media");
                    let path = await this.uploadHelper.uploadFileFromBuffer(image);
                    payload.media = path[0];
                }
                if (payload.myList?.length && !payload.goList)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(422, "Provide golist");
                if (payload.myList?.length) {
                    await this.golistRepository.updateById(payload.goList, {
                        $addToSet: {
                            serviceProviders: { $each: payload.myList },
                        },
                    });
                }
                if (payload.type !== enums_1.TaskType.megablast) {
                    const goList = await this.golistRepository.getById(payload.goList);
                    if (!goList)
                        return reponseapi_helper_1.ResponseHelper.sendResponse(404, "GoList not found");
                    payload.goList = {
                        goListId: payload.goList,
                        title: goList.title,
                        serviceProviders: payload.goListServiceProviders?.map((user) => ({
                            user: user,
                            status: enums_1.ETaskUserStatus.STANDBY,
                        })),
                        taskInterests: goList.taskInterests,
                    };
                    payload.pendingCount = payload.goListServiceProviders.length;
                }
                if (payload.subTasks?.length) {
                    for (let i = 0; i < payload.subTasks.length; i++) {
                        const element = payload.subTasks[i];
                        if (req &&
                            lodash_1.default.isArray(req.files) &&
                            req.files.length &&
                            req.files?.find((file) => file.fieldname === `subTasks[${i}][subTaskMedia]`.toString())) {
                            const image = req.files?.filter((file) => file.fieldname === `subTasks[${i}][subTaskMedia]`.toString());
                            let path = await this.uploadHelper.uploadFileFromBuffer(image);
                            element.media = path[0];
                        }
                    }
                }
                const data = await this.taskRepository.create(payload);
                if (payload.type === enums_1.TaskType.megablast &&
                    payload.taskInterests?.length) {
                    let users = await this.userRepository.getAll({
                        volunteer: { $in: payload.taskInterests },
                    });
                    users?.map(async (user) => {
                        await this.calendarRepository.create({
                            user: user?._id,
                            task: data._id,
                            date: data.date,
                        });
                        await this.notificationService.createAndSendNotification({
                            senderId: payload.postedBy,
                            receiverId: user?._id,
                            type: enums_1.ENOTIFICATION_TYPES.ANNOUNCEMENT,
                            data: { task: data?._id?.toString() },
                            ntitle: "Volunteer Work",
                            nbody: payload.title,
                        });
                    });
                }
                if (payload.type !== enums_1.TaskType.megablast &&
                    payload.goListServiceProviders.length) {
                    payload.goListServiceProviders.map(async (user) => {
                        await this.calendarRepository.create({
                            user: user,
                            task: data._id,
                            date: data.date,
                        });
                    });
                }
                await this.calendarRepository.create({
                    user: payload.postedBy,
                    task: data._id,
                    date: data.date,
                });
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.update = async (_id, dataset, req) => {
            try {
                let taskResponse = await this.taskRepository.getOne({
                    _id: _id,
                });
                if (req &&
                    lodash_1.default.isArray(req.files) &&
                    req.files?.length &&
                    req.files?.find((file) => file.fieldname === "media")) {
                    const image = req.files?.filter((file) => file.fieldname === "media");
                    let path = await this.uploadHelper.uploadFileFromBuffer(image);
                    dataset.media = path[0];
                }
                if (dataset?.media && taskResponse?.media) {
                    this.uploadHelper.deleteFile(taskResponse?.media);
                }
                if (dataset.myList?.length && !dataset.goList)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(422, "Provide golist");
                if (dataset.myList?.length) {
                    await this.golistRepository.updateById(dataset.goList, {
                        $addToSet: {
                            serviceProviders: { $each: dataset.myList },
                        },
                    });
                }
                if (dataset.goList) {
                    const goList = await this.golistRepository.getById(dataset.goList);
                    if (!goList)
                        return reponseapi_helper_1.ResponseHelper.sendResponse(404, "GoList not found");
                    dataset.goList = {
                        goListId: dataset.goList,
                        title: goList.title,
                        serviceProviders: dataset.goListServiceProviders?.map((user) => ({
                            user: user,
                            status: enums_1.ETaskUserStatus.STANDBY,
                        })),
                        taskInterests: goList.taskInterests,
                    };
                }
                if (dataset.subTasks?.length) {
                    for (let i = 0; i < dataset.subTasks.length; i++) {
                        const element = dataset.subTasks[i];
                        if (req &&
                            lodash_1.default.isArray(req.files) &&
                            req.files.length &&
                            req.files?.find((file) => file.fieldname === `subTasks[${i}][subTaskMedia]`.toString())) {
                            const image = req.files?.filter((file) => file.fieldname === `subTasks[${i}][subTaskMedia]`.toString());
                            let path = await this.uploadHelper.uploadFileFromBuffer(image);
                            element.media = path[0];
                        }
                    }
                }
                const response = await this.taskRepository.updateById(_id, dataset);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                if (taskResponse?.type === enums_1.TaskType.event &&
                    dataset.date &&
                    taskResponse.date !== dataset.date)
                    await this.calendarRepository.updateMany({ task: response._id }, {
                        date: response.date,
                    });
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.delete = async (_id) => {
            try {
                const response = await this.taskRepository.updateById(_id, {
                    isDeleted: true,
                });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                await this.calendarRepository.deleteMany({
                    task: response._id,
                });
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.requestToAdded = async (_id, user) => {
            try {
                const isExist = await this.taskRepository.exists({
                    _id: new bson_1.ObjectId(_id),
                    "users.user": new bson_1.ObjectId(user),
                });
                if (isExist)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(422, "You are already in this task");
                const response = await this.taskRepository.updateById(_id, {
                    $addToSet: { users: { user } },
                    $inc: { pendingCount: 1 },
                });
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                let userData = await this.userRepository.getById(user, undefined, "firstName");
                this.notificationService.createAndSendNotification({
                    senderId: user,
                    receiverId: response.postedBy,
                    type: enums_1.ENOTIFICATION_TYPES.TASK_REQUEST,
                    data: { task: response?._id?.toString() },
                    ntitle: "Task Request",
                    nbody: `${userData?.firstName} has requested to be added to the task`,
                });
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.toggleRequest = async (_id, loggedInUser, user, status, type) => {
            try {
                let isExist;
                if (type === "goList") {
                    isExist = await this.taskRepository.exists({
                        _id: new bson_1.ObjectId(_id),
                        "goList.serviceProviders": {
                            $elemMatch: { user: new bson_1.ObjectId(user), status },
                        },
                    });
                }
                else {
                    isExist = await this.taskRepository.exists({
                        _id: new bson_1.ObjectId(_id),
                        users: { $elemMatch: { user: new bson_1.ObjectId(user), status } },
                    });
                }
                if (isExist)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(422, `Status is already ${status}`);
                const updateCount = { $inc: {} };
                if (status == enums_1.ETaskUserStatus.REJECTED)
                    updateCount["$inc"].pendingCount = -1;
                if (status == enums_1.ETaskUserStatus.ACCEPTED) {
                    updateCount["$inc"].pendingCount = -1;
                    updateCount["$inc"].acceptedCount = 1;
                }
                let response;
                if (type === "goList") {
                    response = await this.taskRepository.updateByOne({ _id: new bson_1.ObjectId(_id) }, {
                        $set: { "goList.serviceProviders.$[providers].status": status },
                        ...updateCount,
                    }, { arrayFilters: [{ "providers.user": new bson_1.ObjectId(user) }] });
                }
                else {
                    response = await this.taskRepository.updateByOne({ _id: new bson_1.ObjectId(_id) }, {
                        $set: { "users.$[users].status": status },
                        ...updateCount,
                    }, { arrayFilters: [{ "users.user": new bson_1.ObjectId(user) }] });
                }
                let loggedInUserData = await this.userRepository.getById(loggedInUser, undefined, "firstName");
                let chatId;
                if (response && status == enums_1.ETaskUserStatus.ACCEPTED) {
                    await this.calendarRepository.create({
                        user,
                        task: response._id,
                        date: response.date ?? "2024-11-11",
                        type: enums_1.ECALENDARTaskType.accepted,
                    });
                    this.notificationService.createAndSendNotification({
                        senderId: response.postedBy,
                        receiverId: user,
                        type: enums_1.ENOTIFICATION_TYPES.TASK_ACCEPTED,
                        data: { task: response._id?.toString() },
                        ntitle: "Task Accepted",
                        nbody: `${loggedInUserData?.firstName} accepted your task request`,
                    });
                    chatId = await this.chatRepository.addChatForTask({
                        user: response?.postedBy,
                        task: _id,
                        participant: user,
                        groupName: response?.title,
                        noOfServiceProvider: response.noOfServiceProvider,
                    });
                }
                else if (response && status == enums_1.ETaskUserStatus.REJECTED) {
                    await this.calendarRepository.deleteMany({
                        user: new bson_1.ObjectId(user),
                        task: response._id,
                    });
                    this.notificationService.createAndSendNotification({
                        senderId: response.postedBy,
                        receiverId: user,
                        type: enums_1.ENOTIFICATION_TYPES.TASK_REJECTED,
                        data: { task: response._id?.toString() },
                        ntitle: "Task Rejected",
                        nbody: `${loggedInUserData?.firstName} rejected your task request`,
                    });
                }
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, {
                    response,
                    chat: chatId,
                });
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.taskRepository = new task_repository_1.TaskRepository();
        this.golistRepository = new golist_repository_1.GolistRepository();
        this.calendarRepository = new calendar_repository_1.CalendarRepository();
        this.chatRepository = new chat_repository_1.ChatRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.notificationService = new notification_service_1.default();
        this.uploadHelper = new upload_helper_1.UploadHelper("task");
    }
}
exports.default = TaskService;
//# sourceMappingURL=task.service.js.map