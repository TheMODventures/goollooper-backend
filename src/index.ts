import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import { Server as SocketIOServer, Socket } from "socket.io";

import { APP_HOST, APP_PORT } from "./config/environment.config";
import { Database } from "./config/database.config";
import AdminRoutes from "./api/routes/admin/admin.route";
import UserRoutes from "./api/routes/user.route";
import ChatService from "./api/services/chat.service";
import { notificationSockets } from "./api/services/notification.service";

class App {
  protected app: Application;
  protected database: Database;
  protected adminRoutes: AdminRoutes;
  protected userRoutes: UserRoutes;
  protected io: SocketIOServer;

  constructor() {
    this.app = express();
    this.adminRoutes = new AdminRoutes();
    this.userRoutes = new UserRoutes();
    this.database = new Database();
    this.config();
  }

  private config(): void {
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.get("/", (req, res) =>
      res.json({ message: "Welcome to the goollooper" })
    );
    this.app.use("/api/admin", this.adminRoutes.router);
    this.app.use("/api", this.userRoutes.router);
  }
  public start(): void {
    const appPort = Number(APP_PORT);
    const httpServer = this.app.listen(appPort, APP_HOST!, () => {
      console.log(`Server running at http://${APP_HOST}:${appPort}/`);
    });
    this.io = new SocketIOServer(httpServer);
    ChatService(this.io);
    notificationSockets(this.io);
  }
}

const app = new App();
app.start();
