import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";

import { APP_HOST, APP_PORT } from "./config/environment.config";
import { Database } from "./config/database.config";
import AdminRoutes from "./api/routes/admin/admin.route";
import UserRoutes from "./api/routes/user.route";

class App {
  protected app: Application;
  protected database: Database;
  protected adminRoutes: AdminRoutes;
  protected userRoutes: UserRoutes;

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
    this.app.listen(appPort, APP_HOST!, () => {
      console.log(`Server running at http://${APP_HOST}:${appPort}/`);
    });
  }
}

const app = new App();
app.start();
