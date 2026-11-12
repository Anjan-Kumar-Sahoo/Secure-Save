import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendEmail = async (to: string, options: {
  subject: string;
  template: string;
  data: Record<string, any>;
}): Promise<void> => {
  const html = await generateEmailTemplate(options.template, options.data);

  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: options.subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

const generateEmailTemplate = async (template: string, data: Record<string, any>): Promise<string> => {
  switch (template) {
    case 'otp-verification':
      return generateOtpEmailTemplate(data as { otp: string; expiresAt: Date });
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
};

const generateOtpEmailTemplate = (data: { otp: string; expiresAt: Date }): string => {
  const expiryTime = new Date(data.expiresAt).toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification - Secure Save</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #8B7CFF; color: white; padding: 30px; text-align: center; }
        .content { padding: 40px; }
        .otp-code { font-size: 36px; font-weight: bold; color: #8B7CFF; text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f8ff; border-radius: 8px; letter-spacing: 5px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Secure Save</h1>
          <p>Secure. Simple. Private.</p>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Use the following verification code to complete your registration:</p>
          <div class="otp-code">${data.otp}</div>
          <p><strong>Expires at:</strong> ${expiryTime}</p>
          <div class="warning">
            <strong>Security Notice:</strong> This code will expire in 5 minutes. Never share this code with anyone.
          </div>
          <p>If you didn't request this verification, please contact support immediately.</p>
        </div>
        <div class="footer">
          <p>© 2026 Secure Save. All rights reserved.</p>
          <p>Made with ♥ by AK</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { generateEmailTemplate };