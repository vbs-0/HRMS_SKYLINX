import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../../modules/settings/settings.service";

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 2000;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async onModuleInit() {
    await this.initTransporter();
  }

  private async initTransporter() {
    const host = this.config.get<string>("SMTP_HOST");
    const port = parseInt(this.config.get<string>("SMTP_PORT") || "587", 10);
    const secure = this.config.get<string>("SMTP_SECURE") === "true";
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");

    if (host && user && pass) {
      this.logger.log(`Initializing production SMTP pool → ${host}:${port}`);
      this.transporter = nodemailer.createTransport({
        pool: true,
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10,          // max 10 messages per second (Gmail limit guard)
        rateDelta: 1000,
      } as any);

      try {
        await this.transporter.verify();
        this.logger.log("SMTP connection verified successfully ✓");
      } catch (err: any) {
        this.logger.error(`SMTP verification failed: ${err.message}`);
        await this.logSmtpError("SMTP_VERIFY", err);
        // Don't null out — allow retry on send
      }
    } else {
      this.logger.warn(
        "SMTP_HOST / SMTP_USER / SMTP_PASS not configured. " +
        "Email delivery is DISABLED. Set these in .env to enable.",
      );
    }
  }

  /**
   * Send an email with automatic retry and error logging.
   * Returns true if the email was sent, false otherwise.
   */
  async send(payload: MailPayload): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email skipped (no SMTP configured): ${payload.subject}`);
      await this.logSystemEvent(
        "WARN",
        `Email not sent (SMTP unconfigured) — Subject: "${payload.subject}" To: ${payload.to}`,
      );
      return false;
    }

    const rulesRes = await this.settingsService.rules();
    const branding = (rulesRes.data as any).branding || {};
    const brandName = branding.platformBrand || "SKYLINX PeopleOS";

    const from = `"${brandName} Support" <${this.config.get<string>("EMAIL_FROM") || this.config.get<string>("SMTP_USER")}>`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });

        this.logger.log(
          `Email sent ✓ [attempt ${attempt}] messageId=${info.messageId} to=${payload.to}`,
        );
        await this.logSystemEvent(
          "INFO",
          `Email delivered — messageId: ${info.messageId}, to: ${payload.to}, subject: "${payload.subject}"`,
        );
        return true;
      } catch (err: any) {
        this.logger.error(
          `Email send failed [attempt ${attempt}/${this.maxRetries}]: ${err.message}`,
        );

        if (attempt === this.maxRetries) {
          await this.logSmtpError(`SEND_MAIL to=${payload.to}`, err);
          return false;
        }

        // Exponential backoff
        await this.sleep(this.retryDelayMs * attempt);

        // Re-init transporter in case connection dropped
        if (err.code === "ECONNECTION" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
          this.logger.warn("Re-initializing SMTP transporter after connection error...");
          await this.initTransporter();
        }
      }
    }

    return false;
  }

  /**
   * Build and send a formatted ticket notification email.
   */
  async sendTicketNotification(params: {
    ticketNumber: string;
    subject: string;
    description: string;
    priority: string;
    queue: string;
    createdAt: Date;
  }): Promise<boolean> {
    const rulesRes = await this.settingsService.rules();
    const branding = (rulesRes.data as any).branding || {};
    const brandName = branding.platformBrand || "SKYLINX PeopleOS";
    const recipient = branding.supportEmail || this.config.get<string>("SUPPORT_EMAIL") || "support@example.com";
    const timestamp = params.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const textContent = [
      `New Support Ticket Raised`,
      ``,
      `Ticket ID: ${params.ticketNumber}`,
      `Subject: ${params.subject}`,
      `Department Queue: ${params.queue}`,
      `Priority: ${params.priority}`,
      `Description:`,
      params.description,
      ``,
      `Timestamp: ${timestamp}`,
    ].join("\n");

    const priorityColor =
      params.priority === "High" ? "#dc2626" :
      params.priority === "Medium" ? "#f59e0b" : "#22c55e";

    const htmlContent = `
      <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px 30px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">🎫 New Support Ticket</h2>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">${params.ticketNumber} — raised via ${brandName}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 28px 30px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 130px; border-bottom: 1px solid #f1f5f9;">Ticket ID</td>
              <td style="padding: 10px 0; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${params.ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Subject</td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${params.subject}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Department</td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${params.queue}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Priority</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff; background: ${priorityColor};">${params.priority}</span>
              </td>
            </tr>
          </table>
          <div style="margin-top: 22px;">
            <h4 style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Description</h4>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.7; font-size: 14px;">${params.description.replace(/\n/g, "<br/>")}</p>
            </div>
          </div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 16px 30px;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">Sent via SKYLINX PeopleOS Support Desk · ${timestamp}</p>
        </div>
      </div>
    `;

    return this.send({
      to: recipient,
      subject: `[Support Ticket ${params.ticketNumber}] ${params.subject}`,
      text: textContent,
      html: htmlContent,
    });
  }

  /**
   * Build and send a formatted email inquiry notification.
   */
  async sendEmailInquiry(params: {
    subject: string;
    body: string;
    senderName: string;
    ticketNumber: string;
  }): Promise<boolean> {
    const rulesRes = await this.settingsService.rules();
    const branding = (rulesRes.data as any).branding || {};
    const brandName = branding.platformBrand || "SKYLINX PeopleOS";
    const recipient = this.config.get<string>("SUPPORT_EMAIL") || "support@example.com";
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const textContent = [
      `Support Inquiry Received`,
      ``,
      `From: ${params.senderName}`,
      `Subject: ${params.subject}`,
      ``,
      params.body,
      ``,
      `Ticket: ${params.ticketNumber}`,
      `Timestamp: ${timestamp}`,
    ].join("\n");

    const htmlContent = `
      <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 24px 30px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">📩 Support Inquiry</h2>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">${params.ticketNumber} — from ${params.senderName}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 28px 30px;">
          <p style="margin: 0 0 6px; font-size: 14px; color: #334155;"><strong>From:</strong> ${params.senderName}</p>
          <p style="margin: 0 0 20px; font-size: 14px; color: #334155;"><strong>Subject:</strong> ${params.subject}</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px;">
            <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.7; font-size: 14px;">${params.body.replace(/\n/g, "<br/>")}</p>
          </div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 16px 30px;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">Sent via SKYLINX PeopleOS Support Desk · ${timestamp}</p>
        </div>
      </div>
    `;

    return this.send({
      to: recipient,
      subject: `[Support Inquiry] ${params.subject}`,
      text: textContent,
      html: htmlContent,
    });
  }

  private async logSmtpError(context: string, err: any) {
    try {
      await this.prisma.errorLog.create({
        data: {
          service: "SMTP",
          endpoint: context,
          errorMessage: err.message || "Unknown SMTP error",
          stackTrace: err.stack,
        },
      });
    } catch (e) {
      this.logger.error("Failed to write SMTP error to database", e);
    }
  }

  private async logSystemEvent(level: string, message: string) {
    try {
      await this.prisma.systemLog.create({
        data: {
          service: "SMTP",
          logLevel: level,
          message,
        },
      });
    } catch (e) {
      this.logger.error("Failed to write system log", e);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
