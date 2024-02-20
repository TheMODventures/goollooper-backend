"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const base_repository_1 = require("../base.repository");
const notification_model_1 = require("../../../database/models/notification.model");
class NotificationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(notification_model_1.Notification);
        this.getOneByFilter = async (filter) => {
            const response = await this.model.findOne(filter);
            return response;
        };
    }
}
exports.NotificationRepository = NotificationRepository;
//# sourceMappingURL=notification.repository.js.map