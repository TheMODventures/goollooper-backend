"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = __importDefault(require("../controllers/media/media.controller"));
const base_route_1 = __importDefault(require("./base.route"));
const userFile_validate_1 = require("../../validator/userFile.validate");
class MediaRoutes extends base_route_1.default {
    constructor() {
        super();
        this.validateFilesMiddleware = (req, res, next) => {
            try {
                const fields = ["media"];
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
        this.mediaController = new media_controller_1.default();
        this.initializeRoutes();
    }
    routes() {
        this.router.post("/upload", (0, multer_1.default)().any(), this.validateFilesMiddleware, this.mediaController.upload);
    }
}
exports.default = MediaRoutes;
//# sourceMappingURL=media.route.js.map