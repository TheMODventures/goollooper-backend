"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const service_controller_1 = __importDefault(require("../controllers/service/service.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class ServiceRoutes extends base_route_1.default {
    constructor() {
        super();
        this.serviceController = new service_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "service");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.serviceController.index);
        this.router.post("/create", this.validateRequest, this.serviceController.create);
        this.router.get("/show/:id", this.validateRequest, this.serviceController.show);
        this.router.patch("/update/:id", this.validateRequest, this.serviceController.update);
        this.router.delete("/delete/:id", this.validateRequest, this.serviceController.delete);
        // this.router.post(
        //   "/populate-data",
        //   multer().single("file"),
        //   this.validateRequest,
        //   this.serviceController.populateData
        // );
    }
}
exports.default = ServiceRoutes;
//# sourceMappingURL=service.route.js.map