"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../middleware/validation.middleware");
const base_route_1 = __importDefault(require("./base.route"));
const golist_controller_1 = __importDefault(require("../controllers/golist/golist.controller"));
class GolistRoutes extends base_route_1.default {
    constructor() {
        super();
        this.golistController = new golist_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "golist");
        this.initializeRoutes();
    }
    routes() {
        this.router.get("/", this.validateRequest, this.golistController.index);
        this.router.post("/create", this.validateRequest, this.golistController.create);
        this.router.get("/show/my-list", 
        // this.validateRequest,
        this.golistController.showMyList);
        this.router.get("/show/:id", this.validateRequest, this.golistController.show);
        this.router.patch("/update/:id", this.validateRequest, this.golistController.update);
        this.router.delete("/delete/:id", this.validateRequest, this.golistController.delete);
        this.router.get("/zip-code", this.validateRequest, this.golistController.checkPostalCode);
        this.router.post("/nearest-service-provider", this.validateRequest, this.golistController.getNearestServiceProviders);
        this.router.post("/share", this.validateRequest, this.golistController.shareToMyList);
    }
}
exports.default = GolistRoutes;
//# sourceMappingURL=golist.route.js.map