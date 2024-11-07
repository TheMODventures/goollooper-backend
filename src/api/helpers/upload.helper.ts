import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { StorageEngine } from "multer";
import { v4 as uuidv4 } from "uuid";

import {
  DO_SPACES_KEY,
  DO_SPACES_SECRET,
  DO_SPACES_REGION,
  DO_SPACES_ENDPOINT,
  DO_BUCKET_NAME,
  DO_SUB_FOLDER,
  APP_MODE,
} from "../../config/environment.config";

export class UploadHelper {
  protected subPart: string;
  protected s3: S3Client;
  protected storage: StorageEngine;

  constructor(subPart: string) {
    this.subPart = subPart;
    this.s3 = new S3Client({
      forcePathStyle: true,
      region: DO_SPACES_REGION,
      endpoint: DO_SPACES_ENDPOINT,
      credentials: {
        accessKeyId: DO_SPACES_KEY!,
        secretAccessKey: DO_SPACES_SECRET!,
      },
    });
  }

  uploadFileFromBuffer = async (
    files: Express.Multer.File[]
  ): Promise<string[]> => {
    try {
      const keys: string[] = [];
      const params = files.map((file) => {
        const key = `${DO_SUB_FOLDER}/${APP_MODE}/${this.subPart}/${uuidv4()}-${
          file.originalname
        }`;
        keys.push(key);
        return {
          Bucket: DO_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentDisposition: "inline",
          ACL: "public-read" as ObjectCannedACL,
        };
      });

      await Promise.all(
        params.map((param) => this.s3.send(new PutObjectCommand(param)))
      );
      return keys;
    } catch (error) {
      console.error("Error uploading file to DigitalOcean Spaces:", error);
      throw error;
    }
  };

  fileExists = async (key: string): Promise<boolean> => {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: DO_BUCKET_NAME,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "NotFound") {
        return false;
      } else {
        console.error(
          "Error checking file existence in DigitalOcean Spaces:",
          error
        );
        throw error;
      }
    }
  };

  deleteFile = async (key: string): Promise<void> => {
    if (await this.fileExists(key)) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: DO_BUCKET_NAME,
            Key: key,
          })
        );
        console.log(
          `Successfully deleted file with key ${key} from DigitalOcean Spaces.`
        );
      } catch (error) {
        console.error(
          `Error deleting file with key ${key} from DigitalOcean Spaces:`,
          error
        );
        throw error;
      }
    } else {
      console.log(
        `File with key ${key} does not exist in DigitalOcean Spaces.`
      );
    }
  };
}
