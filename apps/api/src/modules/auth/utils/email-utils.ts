import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { LOGO_BASE64 } from './logo-base64';

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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090B12; margin: 0; padding: 20px; color: #E5E7EB; }
        .container { max-width: 560px; margin: 0 auto; background-color: #0F1322; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #161B30 0%, #0F1322 100%); padding: 36px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .logo { width: 72px; height: 72px; margin: 0 auto 14px auto; display: block; border-radius: 16px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94A3B8; }
        .content { padding: 36px 32px; background-color: #0F1322; }
        .content h2 { margin: 0 0 12px 0; font-size: 20px; color: #FFFFFF; font-weight: 600; }
        .content p { font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 18px 0; }
        .otp-box { background: linear-gradient(180deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 12px; padding: 22px; text-align: center; margin: 26px 0; }
        .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #C4B5FD; font-family: 'Courier New', Courier, monospace; }
        .expiry { font-size: 12px; color: #A78BFA; margin-top: 8px; }
        .warning { background-color: rgba(234, 179, 8, 0.08); border-left: 3px solid #EAB308; padding: 14px; border-radius: 6px; margin: 24px 0; font-size: 13px; color: #FDE047; }
        .footer { background-color: #0B0E17; padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); }
        .footer p { margin: 4px 0; font-size: 12px; color: #64748B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${LOGO_BASE64}" alt="Secure Save Logo" class="logo" />
          <h1>Secure Save</h1>
          <p>Client-Side Encrypted Personal Vault</p>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Use the one-time verification code below to verify your account and access your vault:</p>
          <div class="otp-box">
            <div class="otp-code">${data.otp}</div>
            <div class="expiry">Valid until ${expiryTime}</div>
          </div>
          <div class="warning">
            <strong>Security Notice:</strong> This code will expire in 5 minutes. Never share this code with anyone. Secure Save employees will never ask for your code.
          </div>
          <p>If you did not request this verification code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 Secure Save. All rights reserved.</p>
          <p>Zero-Knowledge Encryption • Made with ♥ by AK</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export { generateEmailTemplate };