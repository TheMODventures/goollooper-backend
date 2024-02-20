"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const upload_helper_1 = require("../../helpers/upload.helper");
const reponseapi_helper_1 = require("../../helpers/reponseapi.helper");
class MediaController {
    constructor() {
        this.upload = async (req, res) => {
            if (req && lodash_1.default.isArray(req.files)) {
                if (req.files.length &&
                    req.files?.find((file) => file.fieldname === "media")) {
                    const image = req.files?.filter((file) => file.fieldname === "media");
                    let path = await this.uploadHelper.uploadFileFromBuffer(image);
                    const response = reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Media uploaded", path);
                    return res.status(response.code).json(response);
                }
            }
            const response = reponseapi_helper_1.ResponseHelper.sendResponse(400, "Upload failed");
            return res.status(response.code).json(response);
        };
        this.uploadHelper = new upload_helper_1.UploadHelper("media");
    }
}
exports.default = MediaController;
//# sourceMappingURL=media.controller.js.map