import pug from 'pug';
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// new Email(user, url).sendWelcome();

export class Email {
  constructor(user, url) {
    // constructor function runs when a new object is created through this class
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Liam Watson <${process.env.EMAIL_FROM}>`;
  }
  // 1) Create a transporter method -(a service that will send the email)
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // brevo
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        auth: {
          user: process.env.BREVO_USERNAME,
          pass: process.env.BREVO_PASSWORD,
        },
      });
    } else {
      return nodemailer.createTransport({
        //createTransport is a method coming from nodemailer
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  // Send the actual email
  async send(fileName, subject) {
    //1) Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/./emails/${fileName}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2) Define the  email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    //3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Adventura Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
}
