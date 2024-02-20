"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGORA_HEADER_TOKEN = exports.STRIPE_SECRET_KEY = exports.STRIPE_WEBHOOK_SECRET = exports.APP_CERTIFICATE = exports.APP_ID = exports.IOS_TEAM_ID = exports.IOS_KEY_ID = exports.IOS_KEY = exports.GOOGLE_MAP_KEY = exports.AWS_SUB_FOLDER = exports.AWS_ENDPOINT = exports.AWS_REGION = exports.AWS_SECRET_ACCESS_KEY = exports.AWS_ACCESS_KEY = exports.AWS_BUCKET_NAME = exports.DO_SPACES_REGION = exports.DO_SUB_FOLDER = exports.DO_BUCKET_NAME = exports.DO_SPACES_NAME = exports.DO_SPACES_SECRET = exports.DO_SPACES_KEY = exports.DO_SPACES_ENDPOINT = exports.MANGO_ATLAS_URI_PRD = exports.MANGO_ATLAS_URI = exports.JWT_REFRESH_SECRET_EXPIRE_IN = exports.JWT_SECRET_EXPIRE_IN = exports.JWT_REFRESH_SECRET_KEY = exports.JWT_SECRET_KEY = exports.APP_PORT = exports.APP_HOST = exports.APP_MODE = void 0;
const dotenv_1 = require("dotenv");
const path = __importStar(require("path"));
(0, dotenv_1.config)({ path: path.join(__dirname, "..", "..", ".env") });
_a = process.env, exports.APP_MODE = _a.APP_MODE, exports.APP_HOST = _a.APP_HOST, exports.APP_PORT = _a.APP_PORT, exports.JWT_SECRET_KEY = _a.JWT_SECRET_KEY, exports.JWT_REFRESH_SECRET_KEY = _a.JWT_REFRESH_SECRET_KEY, exports.JWT_SECRET_EXPIRE_IN = _a.JWT_SECRET_EXPIRE_IN, exports.JWT_REFRESH_SECRET_EXPIRE_IN = _a.JWT_REFRESH_SECRET_EXPIRE_IN, exports.MANGO_ATLAS_URI = _a.MANGO_ATLAS_URI, exports.MANGO_ATLAS_URI_PRD = _a.MANGO_ATLAS_URI_PRD, exports.DO_SPACES_ENDPOINT = _a.DO_SPACES_ENDPOINT, exports.DO_SPACES_KEY = _a.DO_SPACES_KEY, exports.DO_SPACES_SECRET = _a.DO_SPACES_SECRET, exports.DO_SPACES_NAME = _a.DO_SPACES_NAME, exports.DO_BUCKET_NAME = _a.DO_BUCKET_NAME, exports.DO_SUB_FOLDER = _a.DO_SUB_FOLDER, exports.DO_SPACES_REGION = _a.DO_SPACES_REGION, exports.AWS_BUCKET_NAME = _a.AWS_BUCKET_NAME, exports.AWS_ACCESS_KEY = _a.AWS_ACCESS_KEY, exports.AWS_SECRET_ACCESS_KEY = _a.AWS_SECRET_ACCESS_KEY, exports.AWS_REGION = _a.AWS_REGION, exports.AWS_ENDPOINT = _a.AWS_ENDPOINT, exports.AWS_SUB_FOLDER = _a.AWS_SUB_FOLDER, exports.GOOGLE_MAP_KEY = _a.GOOGLE_MAP_KEY, exports.IOS_KEY = _a.IOS_KEY, exports.IOS_KEY_ID = _a.IOS_KEY_ID, exports.IOS_TEAM_ID = _a.IOS_TEAM_ID, exports.APP_ID = _a.APP_ID, exports.APP_CERTIFICATE = _a.APP_CERTIFICATE, exports.STRIPE_WEBHOOK_SECRET = _a.STRIPE_WEBHOOK_SECRET, exports.STRIPE_SECRET_KEY = _a.STRIPE_SECRET_KEY, exports.AGORA_HEADER_TOKEN = _a.AGORA_HEADER_TOKEN;
//# sourceMappingURL=environment.config.js.map