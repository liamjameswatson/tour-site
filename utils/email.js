import pug from 'pug';
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setFlagsFromString } from 'v8';

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
    if (process.env.NODE_ENV !== 'production') {
      // sendinblue
      return nodemailer.createTransport({
        host: process.env.SENDINBLUE_HOST,
        port: process.env.SENDINBLUE_PORT,
        auth: {
          user: 'liamjwatson@aol.com',
          pass: 'xsmtpsib-e7bbdf0a3f6c01a949dcc44539f6562b7fde01762ae7fcee6e389f4e4c1babf1-XazLWsw6yf5GHKnO',
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
  async send(template, subject) {
    //1) Render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

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
