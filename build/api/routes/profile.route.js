"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const userFile_validate_1 = require("../../validator/userFile.validate");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const user_controller_1 = __importDefault(require("../controllers/user/user.controller"));
const auth_user_controller_1 = __importDefault(require("../controllers/auth/auth.user.controller"));
const base_route_1 = __importDefault(require("./base.route"));
class ProfileRoutes extends base_route_1.default {
    constructor() {
        super();
        this.validateFilesMiddleware = (req, res, next) => {
            try {
                const fields = [
                    "profileImage",
                    "gallery",
                    "visuals",
                    "companyLogo",
                    "companyResume",
                    "certificates",
                    "licenses",
                    "insurances",
                ];
                fields.forEach((field) => {
                    const files = req.files?.filter((file) => file.fieldname === field);
                    if (files) {
                        (0, userFile_validate_1.validateFiles)(files, field, res);
                    }
                });
                next();
            }
            catch (error) {
                res.status(500).json({ error: "Internal Server Error" });
            }
        };
        this.userController = new user_controller_1.default();
        this.authController = new auth_user_controller_1.default();
        this.validateRequest = new validation_middleware_1.Validation().reporter(true, "user");
        this.initializeRoutes();
    }
    routes() {
        this.router.post("/check-username", this.validateRequest, this.userController.checkUsername);
        this.router.get("/", this.validateRequest, this.userController.index);
        this.router.get("/show/:id", this.validateRequest, this.userController.show);
        this.router.patch("/update/:id", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.validateRequest, this.userController.update);
        this.router.post("/update-password", this.validateRequest, this.authController.updateData);
        this.router.patch("/schedule/update/:id", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.validateRequest, this.userController.updateSchedule);
        this.router.delete("/delete", this.validateRequest, this.userController.delete);
    }
}
exports.default = ProfileRoutes;
//# sourceMappingURL=profile.route.js.map