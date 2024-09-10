import mongoose from "mongoose";

import {
  APP_MODE,
  MANGO_ATLAS_URI,
  MANGO_ATLAS_URI_PRD,
} from "../config/environment.config";
export class Database {
  protected mangoAtlasURI: string;
  protected mangoAtlasURIPrd: string;

  constructor() {
    this.mangoAtlasURI = MANGO_ATLAS_URI!;
    this.mangoAtlasURIPrd = MANGO_ATLAS_URI_PRD!;
    this.connectDb();
  }
  private connectDb(): void {
    const mangoUrl =
      APP_MODE === "prd" ? this.mangoAtlasURIPrd : this.mangoAtlasURI;
    const options = {
      retryWrites: true,
      autoIndex: true, // build indexes true or false
      family: 4, // Use IPv4, skip trying IPv6
    };
    mongoose
      .connect(mangoUrl, options)
      .then((res) => {
        console.log("connection established at ", mangoUrl);
      })
      .catch((err) => {
        console.log(err);
      });
    mongoose.Promise = global.Promise;
  }
}
