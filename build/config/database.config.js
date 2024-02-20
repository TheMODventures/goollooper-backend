"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_config_1 = require("./environment.config");
class Database {
    constructor() {
        this.mangoAtlasURI = environment_config_1.MANGO_ATLAS_URI;
        this.mangoAtlasURIPrd = environment_config_1.MANGO_ATLAS_URI_PRD;
        this.connectDb();
    }
    connectDb() {
        const mangoUrl = environment_config_1.APP_MODE === "prd" ? this.mangoAtlasURIPrd : this.mangoAtlasURI;
        const options = {
            retryWrites: true,
            autoIndex: true,
            family: 4, // Use IPv4, skip trying IPv6
        };
        mongoose_1.default
            .set("strictPopulate", false)
            .connect(mangoUrl, options)
            .then((res) => {
            console.log("db connected");
        })
            .catch((err) => {
            console.log(err);
        });
        mongoose_1.default.Promise = global.Promise;
    }
}
exports.Database = Database;
//# sourceMappingURL=database.config.js.map