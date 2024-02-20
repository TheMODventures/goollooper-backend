"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const socket_io_1 = require("socket.io");
const environment_config_1 = require("./config/environment.config");
const database_config_1 = require("./config/database.config");
const admin_route_1 = __importDefault(require("./api/routes/admin/admin.route"));
const user_route_1 = __importDefault(require("./api/routes/user.route"));
const chat_service_1 = __importDefault(require("./api/services/chat.service"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.adminRoutes = new admin_route_1.default();
        this.userRoutes = new user_route_1.default();
        this.database = new database_config_1.Database();
        this.config();
    }
    config() {
        this.app.use((0, cors_1.default)());
        this.app.use((0, morgan_1.default)("dev"));
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        this.app.get("/", (req, res) => res.json({ message: "Welcome to the goollooper" }));
        this.app.use("/api/admin", this.adminRoutes.router);
        this.app.use("/api", this.userRoutes.router);
    }
    start() {
        const appPort = Number(environment_config_1.APP_PORT);
        const httpServer = this.app.listen(appPort, environment_config_1.APP_HOST, () => {
            console.log(`Server running at http://${environment_config_1.APP_HOST}:${appPort}/`);
        });
        this.io = new socket_io_1.Server(httpServer);
        (0, chat_service_1.default)(this.io);
    }
}
const app = new App();
app.start();
//# sourceMappingURL=index.js.map