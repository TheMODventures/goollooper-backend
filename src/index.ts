import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";
import { APP_HOST, APP_PORT } from "./config/environment.config";
import { Database } from "./config/database.config";
import AdminRoutes from "./api/routes/admin/admin.route";
import UserRoutes from "./api/routes/user.route";
import ChatService from "./api/services/chat.service";
import { notificationSockets } from "./api/services/notification.service";
import StripeController from "./api/controllers/stripe/stripe.controller";

class App {
  protected app: Application;
  protected database: Database;
  protected adminRoutes: AdminRoutes;
  protected userRoutes: UserRoutes;
  protected io: SocketIOServer;
  protected stripeController: StripeController;

  constructor() {
    this.app = express();
    this.adminRoutes = new AdminRoutes();
    this.userRoutes = new UserRoutes();
    this.database = new Database();
    this.stripeController = new StripeController();
    this.config();
  }

  private config(): void {
    this.app.post(
      "/webhook/subscription",
      express.raw({ type: "application/json" }),
      this.stripeController.webhook
    );

    this.app.post(
      "/webhook/connect-account-onboarding",
      express.raw({ type: "application/json" }),
      this.stripeController.webhookConnectAccount
    );
    this.app.set("trust proxy", true);
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true, limit: "100mb" }));

    this.app.get("/", (req, res) =>
      res.json({ message: "Welcome to the goollooper" })
    );

    this.app.use("/api/admin", this.adminRoutes.router);
    this.app.use("/api", this.userRoutes.router);
  }
  public start(): void {
    const appPort = Number(APP_PORT);
    const httpServer = this.app.listen(appPort, () => {
      console.log(`Server running at http://${APP_HOST}:${appPort}`);
    });
    this.io = new SocketIOServer(httpServer);
    ChatService(this.io);
    notificationSockets(this.io);
  }
}

const app = new App();
app.start();
