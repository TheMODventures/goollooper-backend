import nodeMailer from "nodemailer";
import { DateHelper } from "./date.helper";

class Mailer {
  static async sendEmail({
    email,
    subject,
    message,
  }: {
    email: string;
    subject: string;
    message: string;
  }) {
    const transporter = nodeMailer.createTransport({
      host: "live.smtp.mailtrap.io",
      port: 587,
      auth: {
        user: "api",
        pass: "8f5da552656f8f478f83daaea0581b06",
      },
    });

    const dateHelper = new DateHelper();
    const htmlMessage = dateHelper.mailTemplate(new Date(), message);

    const sender = {
      address: "hello@goollooper.com",
      name: "Goollooper",
    };

    const mailOptions = {
      from: sender,
      to: email,
      subject,
      html: htmlMessage,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info);
    } catch (error) {
      console.error("Error sending email: ", error);
    }
  }
}

export default Mailer;
