process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";


// Reusable SMTP transporter configuration (Production-grade connection pool)
const getTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`[SMTP] Initializing production-grade connection pool to ${host}:${port}`);
    return nodemailer.createTransport({
      pool: true, // Reuse connections instead of opening/closing sockets per mail
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Bypass self-signed cert exceptions in local dev proxies
      },
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    });
  }

  // Safe fallback for sandbox testing if SMTP is not configured
  console.warn("[SMTP] Warning: SMTP_HOST/SMTP_USER/SMTP_PASS not configured. Falling back to auto-generated test Ethereal account.");
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Cache the transporter across Next.js API requests to avoid overhead
let cachedTransporter: any = null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, id, title, queue, priority, description, timestamp } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Subject and description are required" },
        { status: 400 }
      );
    }

    const emailFrom = process.env.EMAIL_FROM || "support@skylinx.com";
    const hrEmail = "support@skylinx.com";
    const isEmailInquiry = type === "email";
    
    const subject = isEmailInquiry 
      ? `[Support Inquiry] ${title}` 
      : `[New Support Ticket - ${id}] ${title}`;

    const textContent = isEmailInquiry
      ? `A new email inquiry has been sent to HR support.\n\nFrom: Employee (Chappidi Gunadeep Yadav)\nSubject: ${title}\nInquiry Body:\n${description}\n\nTimestamp: ${timestamp}`
      : `A new support ticket has been raised.\n\nTicket ID: ${id}\nSubject: ${title}\nDepartment Queue: ${queue}\nPriority: ${priority}\nDescription:\n${description}\n\nTimestamp: ${timestamp}`;

    const htmlContent = isEmailInquiry
      ? `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #dce2eb; border-radius: 8px; max-width: 600px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #38a7f4; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px;">Support Inquiry Received</h2>
          </div>
          <div style="padding: 25px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #172033;"><strong>From:</strong> Employee (Chappidi Gunadeep Yadav)</p>
            <p style="margin: 0 0 20px 0; font-size: 14px; color: #172033;"><strong>Subject:</strong> ${title}</p>
            <div style="background-color: #f8fafc; border: 1px solid #eef2f7; padding: 18px; border-radius: 6px;">
              <p style="white-space: pre-wrap; margin: 0; color: #34465f; line-height: 1.6; font-size: 14px;">${description.replace(/\n/g, "<br/>")}</p>
            </div>
            <p style="font-size: 11px; color: #8ca0bf; margin-top: 25px; border-top: 1px solid #eef2f7; padding-top: 15px;">Sent via SKYLINX PeopleOS Support Desk at: ${timestamp}</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: sans-serif; padding: 25px; border: 1px solid #dce2eb; border-radius: 8px; max-width: 600px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #38a7f4; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px;">New Support Ticket Raised</h2>
          </div>
          <div style="padding: 25px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #8ca0bf; width: 120px; border-bottom: 1px solid #eef2f7;">Ticket ID:</td>
                <td style="padding: 8px 0; color: #172033; font-weight: bold; border-bottom: 1px solid #eef2f7;">${id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #8ca0bf; border-bottom: 1px solid #eef2f7;">Subject:</td>
                <td style="padding: 8px 0; color: #172033; border-bottom: 1px solid #eef2f7;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #8ca0bf; border-bottom: 1px solid #eef2f7;">Department:</td>
                <td style="padding: 8px 0; color: #172033; border-bottom: 1px solid #eef2f7;">${queue}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #8ca0bf; border-bottom: 1px solid #eef2f7;">Priority:</td>
                <td style="padding: 8px 0; color: #172033; border-bottom: 1px solid #eef2f7;">${priority}</td>
              </tr>
            </table>
            <h4 style="margin: 0 0 8px 0; color: #8ca0bf; font-size: 13px; uppercase">Description:</h4>
            <div style="background-color: #f8fafc; border: 1px solid #eef2f7; padding: 18px; border-radius: 6px; margin-bottom: 25px;">
              <p style="white-space: pre-wrap; margin: 0; color: #34465f; line-height: 1.6; font-size: 14px;">${description.replace(/\n/g, "<br/>")}</p>
            </div>
            <p style="font-size: 11px; color: #8ca0bf; margin-top: 25px; border-top: 1px solid #eef2f7; padding-top: 15px;">Sent via SKYLINX PeopleOS Support Desk at: ${timestamp}</p>
          </div>
        </div>
      `;

    if (!cachedTransporter) {
      cachedTransporter = await getTransporter();
    }

    // Verify SMTP connection config before sending
    await cachedTransporter.verify();

    const mailOptions = {
      from: `"SKYLINX Support" <${emailFrom}>`,
      to: hrEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await cachedTransporter.sendMail(mailOptions);
    console.log(`[SMTP] Email dispatched successfully. Message ID: ${info.messageId}`);

    const isTestMode = !process.env.SMTP_HOST;
    if (isTestMode) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[SMTP] [Test Mode] Preview URL generated: ${previewUrl}`);
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        testMode: true,
        previewUrl,
      });
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      testMode: false,
    });
  } catch (error: any) {
    console.error("[SMTP] Error sending support email:", error);
    // Reset transporter cache if connection error to force re-initialization on retry
    cachedTransporter = null;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email via SMTP" },
      { status: 500 }
    );
  }
}
