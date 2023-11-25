import { config } from "dotenv";
import * as path from "path";

config({ path: path.join(__dirname, "..", "..", ".env") });

export const {
  APP_MODE,
  APP_HOST,
  APP_PORT,
  JWT_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
  JWT_SECRET_EXPIRE_IN,
  JWT_REFRESH_SECRET_EXPIRE_IN,
  MANGO_ATLAS_URI,
  MANGO_ATLAS_URI_PRD,
  DO_SPACES_ENDPOINT,
  DO_SPACES_KEY,
  DO_SPACES_SECRET,
  DO_SPACES_NAME,
  DO_BUCKET_NAME,
  DO_SUB_FOLDER,
  DO_SPACES_REGION,
  AWS_BUCKET_NAME,
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_ENDPOINT,
  AWS_SUB_FOLDER,
} = process.env;
