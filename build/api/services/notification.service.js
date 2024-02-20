"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const notification_repository_1 = require("../repository/notification/notification.repository");
const user_repository_1 = require("../repository/user/user.repository");
const enums_1 = require("../../database/interfaces/enums");
const notification_helper_1 = require("../helpers/notification.helper");
class NotificationService {
    constructor() {
        this.index = async (page, limit = 20, filter, populate) => {
            try {
                // const getDocCount = await this.notificationRepository.getCount(filter);
                const response = await this.notificationRepository.getAllWithPagination(filter, "", "", {
                    createdAt: "desc",
                }, populate, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, response.pagination.totalItems);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.create = async (payload) => {
            try {
                const data = await this.notificationRepository.create(payload);
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, data);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.createAndSendNotificationMultiple = async (payload, userId) => {
            try {
                if (payload.all) {
                    const users = await this.userRepository.getAll({
                        isDeleted: false,
                        $or: [
                            { role: enums_1.EUserRole.user },
                            { role: enums_1.EUserRole.serviceProvider },
                        ],
                    }, undefined, "fcmTokens");
                    users.forEach(async (user) => {
                        await this.notificationRepository.create({
                            ...payload,
                            receiver: user._id,
                            sender: userId,
                            type: enums_1.ENOTIFICATION_TYPES.ANNOUNCEMENT,
                        });
                        if (user?.fcmTokens && user.fcmTokens.length)
                            notification_helper_1.NotificationHelper.sendNotification({
                                title: payload.title,
                                tokens: user?.fcmTokens,
                                body: payload.content,
                            });
                    });
                }
                else if (payload.receiver?.length) {
                    const users = await this.userRepository.getAll({ email: payload.receiver }, undefined, "fcmTokens");
                    users.forEach(async (user) => {
                        await this.notificationRepository.create({
                            ...payload,
                            receiver: user._id,
                            sender: userId,
                            type: enums_1.ENOTIFICATION_TYPES.ANNOUNCEMENT,
                        });
                        if (user?.fcmTokens && user.fcmTokens.length)
                            notification_helper_1.NotificationHelper.sendNotification({
                                title: payload.title,
                                tokens: user?.fcmTokens,
                                body: payload.content,
                            });
                    });
                }
                return reponseapi_helper_1.ResponseHelper.sendResponse(201, "Successfully sent");
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.show = async (_id) => {
            try {
                const filter = {
                    _id,
                };
                const response = await this.notificationRepository.getOne(filter);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.update = async (_id, dataset) => {
            try {
                const response = await this.notificationRepository.updateById(_id, dataset);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.delete = async (_id) => {
            try {
                const response = await this.notificationRepository.delete({
                    _id,
                });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.createAndSendNotification = async ({ sender, senderId, receiverId, type, data, nbody, ntitle, }) => {
            let body = "", title = "";
            const { fcmTokens, firstName, username, lastName } = await this.userRepository.getById(receiverId.toString(), undefined, "fcmTokens firstName username lastName");
            if (!sender && senderId)
                sender = await this.userRepository.getById(senderId.toString(), undefined, "fcmTokens firstName username lastName");
            console.log("fcmToken from notification model >>> ", fcmTokens);
            switch (type) {
                case enums_1.ENOTIFICATION_TYPES.MESSAGE_REQUEST:
                    title = ntitle ?? `#sender`;
                    body = nbody ?? `sends you a message request`;
                    break;
                case enums_1.ENOTIFICATION_TYPES.MESSAGE_REQUEST_ACCEPT:
                    title = ntitle ?? `#sender`;
                    body = nbody ?? `You accepted #sender's message request`;
                    break;
                case enums_1.ENOTIFICATION_TYPES.ANNOUNCEMENT:
                    title = ntitle ?? `New Announcement`;
                    body = nbody ?? `Task request`;
                    break;
                case enums_1.ENOTIFICATION_TYPES.TASK_ACCEPTED:
                    title = ntitle ?? `#sender`;
                    body = nbody ?? `#sender accepted your task request`;
                    break;
                case enums_1.ENOTIFICATION_TYPES.TASK_REJECTED:
                    title = ntitle ?? `#sender`;
                    body = nbody ?? `#sender rejected your task request`;
                    break;
                case enums_1.ENOTIFICATION_TYPES.TASK_REQUEST:
                    title = ntitle ?? `#sender`;
                    body = nbody ?? `#sender has requested to be added to the task`;
                    break;
                default:
                    break;
            }
            const n = {
                receiver: receiverId,
                sender: sender?._id,
                type: type,
                content: body,
                title: title,
                data,
            };
            const notification = await this.notificationRepository.create(n);
            notification_helper_1.NotificationHelper.sendNotification({
                title,
                body,
                tokens: fcmTokens,
                data,
            });
            return notification;
        };
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
}
exports.default = NotificationService;
//# sourceMappingURL=notification.service.js.map