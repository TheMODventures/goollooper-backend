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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationHelper = void 0;
const admin = __importStar(require("firebase-admin"));
const serviceAccount = __importStar(require("./goollooper-service.json"));
class NotificationHelperC {
    constructor() {
        this.sendNotification = async (notification) => {
            try {
                const message = {
                    tokens: notification.tokens,
                    notification: {
                        title: notification.title,
                        body: notification.body,
                    },
                    android: { data: notification.data },
                    data: notification.data,
                };
                const response = await admin.messaging().sendEachForMulticast(message);
                response.responses.forEach((resp, idx) => {
                    if (resp.error) {
                        console.error(`Failed to send notification to ${resp.error}`);
                    }
                    else {
                        console.log(`Notification sent successfully to ${notification.tokens[idx]}`);
                    }
                });
            }
            catch (error) {
                console.error("Error sending message:", error);
            }
        };
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}
exports.NotificationHelper = new NotificationHelperC();
//# sourceMappingURL=notification.helper.js.map