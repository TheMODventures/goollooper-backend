import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { StorageEngine } from "multer";
import { uuid } from "uuidv4";

import {
  APP_MODE,
  AWS_ACCESS_KEY,
  AWS_ENDPOINT,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  AWS_SUB_FOLDER,
  DO_BUCKET_NAME,
  DO_SPACES_ENDPOINT,
  DO_SPACES_KEY,
  DO_SPACES_REGION,
  DO_SPACES_SECRET,
  DO_SUB_FOLDER,
} from "../../config/environment.config";

export class UploadHelper {
  protected subPart: string;
  protected s3: S3Client;
  protected storage: StorageEngine;

  constructor(subPart: string) {
    this.subPart = subPart;
    this.s3 = new S3Client({
      forcePathStyle: false,
      region: AWS_REGION!,
      endpoint: AWS_ENDPOINT!,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  uploadFileFromBuffer = async (file: Express.Multer.File): Promise<string> => {
    const buffer = file.buffer;
    const contentType = file.mimetype;
    const fileName = file.originalname;
    try {
      const key = `${AWS_SUB_FOLDER!}/${APP_MODE}/${
        this.subPart
      }/${uuid()}-${fileName}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: DO_BUCKET_NAME!,
          ACL: "public-read",
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ContentDisposition: "inline",
        })
      );
      console.log(`Successfully uploaded file with key ${key} to S3 bucket.`);
      return key;
    } catch (error) {
      console.log(
        `Error uploading file with key ${fileName} to S3 bucket:`,
        error
      );
      throw error;
    }
  };

  fileExists = async (key: string): Promise<boolean> => {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: DO_BUCKET_NAME!,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      console.log(error);
      if (error instanceof Error && error.name === "NotFound") {
        return false;
      } else {
        throw error;
      }
    }
  };

  deleteFile = async (key: string): Promise<void> => {
    if (await this.fileExists(key)) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: DO_BUCKET_NAME!,
            Key: key,
          })
        );
        console.log(
          `Successfully deleted file with key ${key} from S3 bucket.`
        );
      } catch (error) {
        console.log(
          `Error deleting file with key ${key} from S3 bucket:`,
          error
        );
        throw error;
      }
    } else {
      console.log(`File with key ${key} does not exist in S3 bucket.`);
    }
  };
}
