"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadHelper = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const environment_config_1 = require("../../config/environment.config");
class UploadHelper {
    constructor(subPart) {
        this.uploadFileFromBuffer = async (files) => {
            try {
                let keys = [];
                let key = "";
                const params = files.map((file) => {
                    key = `${environment_config_1.AWS_SUB_FOLDER}/${environment_config_1.APP_MODE}/${this.subPart}/${(0, uuid_1.v4)()}-${file.originalname}`;
                    return {
                        Bucket: environment_config_1.AWS_BUCKET_NAME,
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ContentDisposition: "inline",
                    };
                });
                await Promise.all(params.map((param) => this.s3.send(new client_s3_1.PutObjectCommand(param)).then((v) => {
                    keys.push(param.Key);
                })));
                return keys;
            }
            catch (error) {
                console.log(`Error uploading file to S3 bucket:`, error);
                throw error;
            }
        };
        this.fileExists = async (key) => {
            try {
                await this.s3.send(new client_s3_1.HeadObjectCommand({
                    Bucket: environment_config_1.AWS_BUCKET_NAME,
                    Key: key,
                }));
                return true;
            }
            catch (error) {
                console.log(error);
                if (error instanceof Error && error.name === "NotFound") {
                    return false;
                }
                else {
                    throw error;
                }
            }
        };
        this.deleteFile = async (key) => {
            if (await this.fileExists(key)) {
                try {
                    await this.s3.send(new client_s3_1.DeleteObjectCommand({
                        Bucket: environment_config_1.AWS_BUCKET_NAME,
                        Key: key,
                    }));
                    console.log(`Successfully deleted file with key ${key} from S3 bucket.`);
                }
                catch (error) {
                    console.log(`Error deleting file with key ${key} from S3 bucket:`, error);
                    throw error;
                }
            }
            else {
                console.log(`File with key ${key} does not exist in S3 bucket.`);
            }
        };
        this.subPart = subPart;
        this.s3 = new client_s3_1.S3Client({
            forcePathStyle: false,
            region: environment_config_1.AWS_REGION,
            endpoint: environment_config_1.AWS_ENDPOINT,
            credentials: {
                accessKeyId: environment_config_1.AWS_ACCESS_KEY,
                secretAccessKey: environment_config_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
}
exports.UploadHelper = UploadHelper;
//# sourceMappingURL=upload.helper.js.map