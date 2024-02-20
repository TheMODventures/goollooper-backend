"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRepository = void 0;
const subscription_model_1 = require("../../../database/models/subscription.model");
const base_repository_1 = require("../base.repository");
class SubscriptionRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(subscription_model_1.Subscription);
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
//# sourceMappingURL=subscription.repository.js.map