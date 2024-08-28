import { Request, Response } from "express";
import _ from "lodash";
import { UploadHelper } from "../../helpers/upload.helper";
import { ResponseHelper } from "../../helpers/reponseapi.helper";
import { SUCCESS_DATA_INSERTION_PASSED } from "../../../constant";

class MediaController {
  private uploadHelper: UploadHelper;

  constructor() {
    this.uploadHelper = new UploadHelper("media");
  }

  upload = async (req: Request, res: Response) => {
    console.log("req.files", req.files);

    if (req && _.isArray(req.files)) {
      if (
        req.files.length &&
        req.files?.find((file) => file.fieldname === "media")
      ) {
        const image = req.files?.filter((file) => file.fieldname === "media");
        let path: any = await this.uploadHelper.uploadFileFromBuffer(image);
        const response = ResponseHelper.sendSuccessResponse(
          "Media uploaded",
          path
        );
        return res.status(response.code).json(response);
      }
    }
    const response = ResponseHelper.sendResponse(400, "Upload failed");
    return res.status(response.code).json(response);
  };
}

export default MediaController;
