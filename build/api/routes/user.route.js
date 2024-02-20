"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const base_route_1 = __importDefault(require("./base.route"));
const auth_user_route_1 = __importDefault(require("./auth.user.route"));
const service_route_1 = __importDefault(require("./service.route"));
const subscription_route_1 = __importDefault(require("./subscription.route"));
const profile_route_1 = __importDefault(require("./profile.route"));
const state_route_1 = __importDefault(require("./state.route"));
const golist_route_1 = __importDefault(require("./golist.route"));
const notification_route_1 = __importDefault(require("./notification.route"));
const task_route_1 = __importDefault(require("./task.route"));
const rating_route_1 = __importDefault(require("./rating.route"));
const calendar_route_1 = __importDefault(require("./calendar.route"));
const chat_route_1 = __importDefault(require("./chat.route"));
const media_route_1 = __importDefault(require("./media.route"));
const guideline_route_1 = __importDefault(require("./guideline.route"));
const transaction_route_1 = __importDefault(require("./transaction.route"));
const stripe_route_1 = __importDefault(require("./stripe.route"));
const wallet_route_1 = __importDefault(require("./wallet.route"));
class UserRoutes extends base_route_1.default {
    constructor() {
        super();
        this.authRoutes = new auth_user_route_1.default();
        this.serviceRoutes = new service_route_1.default();
        this.subscriptionRoutes = new subscription_route_1.default();
        this.profileRoutes = new profile_route_1.default();
        this.stateRoutes = new state_route_1.default();
        this.authorize = new authorize_middleware_1.Authorize();
        this.golistRoutes = new golist_route_1.default();
        this.notificationRoutes = new notification_route_1.default();
        this.taskRoutes = new task_route_1.default();
        this.ratingRoutes = new rating_route_1.default();
        this.calendarRoutes = new calendar_route_1.default();
        this.chatRoutes = new chat_route_1.default();
        this.mediaRoutes = new media_route_1.default();
        this.guidelineRoutes = new guideline_route_1.default();
        this.transactionRoutes = new transaction_route_1.default();
        this.stripeRoutes = new stripe_route_1.default();
        this.walletRoutes = new wallet_route_1.default();
        this.initializeRoutes();
    }
    routes() {
        this.router.use("/auth", this.authRoutes.router);
        this.router.use("/guideline", this.guidelineRoutes.router);
        this.router.use(this.authorize.validateAuth);
        this.router.use("/service", this.serviceRoutes.router);
        this.router.use("/subscription", this.subscriptionRoutes.router);
        this.router.use("/user", this.profileRoutes.router);
        this.router.use("/location-data", this.stateRoutes.router);
        this.router.use("/list", this.golistRoutes.router);
        this.router.use("/notification", this.notificationRoutes.router);
        this.router.use("/task", this.taskRoutes.router);
        this.router.use("/rating", this.ratingRoutes.router);
        this.router.use("/calendar", this.calendarRoutes.router);
        this.router.use("/chat", this.chatRoutes.router);
        this.router.use("/media", this.mediaRoutes.router);
        this.router.use("/transaction", this.transactionRoutes.router);
        this.router.use("/stripe", this.stripeRoutes.router);
        this.router.use("/wallet", this.walletRoutes.router);
    }
}
exports.default = UserRoutes;
//# sourceMappingURL=user.route.js.map