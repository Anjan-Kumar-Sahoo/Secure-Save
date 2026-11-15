import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_TIMEOUT_MS = 10_000;

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required SMTP configuration: ${name}`);
  }
  return value;
};

const getPort = (): number => {
  const rawPort = process.env.SMTP_PORT?.trim() || '587';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid SMTP_PORT: ${rawPort}`);
  }

  return port;
};

const getSecureSetting = (port: number): boolean => {
  const configuredSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (configuredSecure === 'true') return true;
  if (configuredSecure === 'false') return false;
  if (configuredSecure) {
    throw new Error(`Invalid SMTP_SECURE: ${configuredSecure}. Use true or false.`);
  }
  return port === 465;
};

const getTransporter = () => {
  const port = getPort();
  const isSecure = getSecureSetting(port);
  const host = getRequiredEnv('SMTP_HOST');
  const user = getRequiredEnv('SMTP_USER');
  const password = getRequiredEnv('SMTP_PASSWORD');

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass: password
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    requireTLS: !isSecure && port === 587,
    tls: {
      rejectUnauthorized: true
    }
  });
};

export const sendEmail = async (to: string, options: {
  subject: string;
  template: string;
  data: Record<string, any>;
}): Promise<void> => {
  const html = await generateEmailTemplate(options.template, options.data);
  const transporter = getTransporter();

  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'Secure Save';
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: options.subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}, messageId: ${info.messageId}`);
  } catch (error: any) {
    console.error('Email sending failed with detail:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? 'SET' : 'MISSING'
    });
    throw new Error(`Failed to send email: ${error.message || 'SMTP error'}`);
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