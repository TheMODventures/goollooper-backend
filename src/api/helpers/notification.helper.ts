import * as admin from "firebase-admin";
import * as serviceAccount from "./goollooper-service.json";

class NotificationHelperC {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }

  sendNotification = async (notification: PushNotification) => {
    try {
      const data = replaceNullUndefinedWithEmptyString(notification.data ?? {});
      const message: admin.messaging.MulticastMessage = {
        tokens: notification.tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        android: { data },
        data,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      response.responses.forEach((resp, idx) => {
        if (resp.error) {
          console.error(`Failed to send notification to ${resp.error}`);
        } else {
          console.log`Notification sent successfully to ${notification.tokens[idx]}`;
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
}

function replaceNullUndefinedWithEmptyString(obj: any) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key] === null || obj[key] === undefined) {
        obj[key] = "";
      }
    }
  }
  return obj;
}
export interface PushNotification {
  tokens: string[];
  title: string;
  body: string;
  data?: any;
}

export const NotificationHelper = new NotificationHelperC();
