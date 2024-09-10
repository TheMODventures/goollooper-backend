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
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "d786f90c32a85f",
        pass: "ad999c91a4882c",
      },
    });

    // Ensure DateHelper's mailTemplate method is called with proper parameters
    const dateHelper = new DateHelper();
    const htmlMessage = dateHelper.mailTemplate(new Date(), message);

    const mailOptions = {
      from: "goollooperinc@gmail.com",
      to: email,
      subject,
      html: htmlMessage,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (error) {
      console.error("Error sending email: ", error);
    }
  }
}

export default Mailer;
