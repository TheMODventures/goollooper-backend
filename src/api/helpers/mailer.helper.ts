import nodeMailer from "nodemailer";

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
      service: "gmail",
      auth: {
        user: "usman09salman@gmail.com",
        pass: "cjci gstl vfgr hvcd",
      },
    });

    const mailOptions = {
      from: "usman09salam@gmail.com",
      to: email,
      subject,
      html: message,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      // console.log("Email sent: " + info.response);
    } catch (error) {
      console.log(error);
    }
  }
}

export default Mailer;
