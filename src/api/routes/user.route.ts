import { Authorize } from "../../middleware/authorize.middleware";
import BaseRoutes from "./base.route";
import AuthRoutes from "./auth.user.route";
import ServiceRoutes from "./service.route";
import SubscriptionRoutes from "./subscription.route";
import ProfileRoutes from "./profile.route";
import StateRoutes from "./state.route";
import GolistRoutes from "./golist.route";
import NotificationRoutes from "./notification.route";
import TaskRoutes from "./task.route";
import RatingRoutes from "./rating.route";
import CalendarRoutes from "./calendar.route";
import ChatRoutes from "./chat.route";
import MediaRoutes from "./media.route";
import GuidelineRoutes from "./guideline.route";

class UserRoutes extends BaseRoutes {
  private authRoutes: AuthRoutes;
  private serviceRoutes: ServiceRoutes;
  private subscriptionRoutes: SubscriptionRoutes;
  private profileRoutes: ProfileRoutes;
  private stateRoutes: StateRoutes;
  private authorize: Authorize;
  private golistRoutes: GolistRoutes;
  private notificationRoutes: NotificationRoutes;
  private taskRoutes: TaskRoutes;
  private ratingRoutes: RatingRoutes;
  private calendarRoutes: CalendarRoutes;
  private chatRoutes: ChatRoutes;
  private mediaRoutes: MediaRoutes;
  private guidelineRoutes: GuidelineRoutes;

  constructor() {
    super();
    this.authRoutes = new AuthRoutes();
    this.serviceRoutes = new ServiceRoutes();
    this.subscriptionRoutes = new SubscriptionRoutes();
    this.profileRoutes = new ProfileRoutes();
    this.stateRoutes = new StateRoutes();
    this.authorize = new Authorize();
    this.golistRoutes = new GolistRoutes();
    this.notificationRoutes = new NotificationRoutes();
    this.taskRoutes = new TaskRoutes();
    this.ratingRoutes = new RatingRoutes();
    this.calendarRoutes = new CalendarRoutes();
    this.chatRoutes = new ChatRoutes();
    this.mediaRoutes = new MediaRoutes();
    this.guidelineRoutes = new GuidelineRoutes();
    this.initializeRoutes();
  }

  protected routes(): void {
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
  }
}

export default UserRoutes;
