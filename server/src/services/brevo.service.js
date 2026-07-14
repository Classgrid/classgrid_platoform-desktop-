/**
 * Classgrid — Unified Email Service (Smart Router)
 *
 * Three channels:
 *   "support"      → Brevo SMTP → support@classgrid.in
 *   "noreply"      → Brevo SMTP → noreply@classgrid.in  (DEFAULT)
 *   "notification"  → Resend API → notification@updates.classgrid.in
 *
 * ALL channels set replyTo → support@classgrid.in
 *
 * Usage:
 *   await sendEmail({ to, subject, html, text, channel: "notification" });
 */

import nodemailer from "nodemailer";
import { sendViaResend } from "./resend.service.js";

// ─────────────────────────────────────────────────
// CHANNEL CONFIGURATION
// ─────────────────────────────────────────────────
const CHANNELS = {
  support: {
    fromName: "Classgrid Support",
    fromEmail: "support@classgrid.in",
    provider: "brevo",
  },
  noreply: {
    fromName: "Classgrid",
    fromEmail: "noreply@classgrid.in",
    provider: "brevo",
  },
  billing: {
    fromName: "Classgrid Billing",
    fromEmail: "billing@classgrid.in",
    provider: "brevo",
  },
  notification: {
    fromName: "Classgrid Notifications",
    fromEmail: "notification@updates.classgrid.in",
    provider: "resend",
  },
};

const DEFAULT_CHANNEL = "noreply";
const SUPPORT_REPLY_TO = "support@classgrid.in";

// ─────────────────────────────────────────────────
// BREVO SMTP TRANSPORTER
// ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ Brevo SMTP error:", err.message);
  } else {
    console.log("✅ Brevo SMTP ready");
  }
});

// ─────────────────────────────────────────────────
// SEND VIA BREVO SMTP
// ─────────────────────────────────────────────────
const sendViaBrevo = async ({ to, subject, html, text, fromName, fromEmail, replyTo }) => {
  console.log(`[Brevo] Sending to: ${to} | From: ${fromEmail}`);

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    replyTo: replyTo || SUPPORT_REPLY_TO,
    to,
    subject,
    text,
    html,
  });

  console.log(`[Brevo] ✅ Email sent to: ${to} | ID: ${info.messageId}`);
  return { ...info, provider: "brevo" };
};

// ─────────────────────────────────────────────────
// UNIFIED SEND EMAIL (SMART ROUTER)
// ─────────────────────────────────────────────────
/**
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.subject - Subject line
 * @param {string} opts.html - HTML body
 * @param {string} [opts.text] - Plain text fallback
 * @param {string} [opts.channel] - "support" | "noreply" | "notification" (default: "noreply")
 * @param {string} [opts.fromName] - Override sender name
 * @param {string} [opts.fromEmail] - Override sender email
 * @param {string} [opts.replyTo] - Override reply-to (default: support@classgrid.in)
 */
export const sendEmail = async ({ to, subject, html, text, channel, fromName, fromEmail, replyTo }) => {
  try {
    console.log("=== EMAIL FUNCTION ENTERED ===");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);

    // Resolve channel config
    const ch = CHANNELS[channel] || CHANNELS[DEFAULT_CHANNEL];
    const resolvedFromName = fromName || ch.fromName;
    const resolvedFromEmail = fromEmail || ch.fromEmail;
    const resolvedReplyTo = replyTo || SUPPORT_REPLY_TO;
    const provider = ch.provider;

    console.log(`[EmailRouter] Channel: ${channel || DEFAULT_CHANNEL} | Provider: ${provider} | From: ${resolvedFromEmail}`);

    let result;

    if (provider === "resend") {
      // Route to Resend API
      result = await sendViaResend({
        to,
        subject,
        html,
        text,
        replyTo: resolvedReplyTo,
      });
    } else {
      // Route to Brevo SMTP
      result = await sendViaBrevo({
        to,
        subject,
        html,
        text,
        fromName: resolvedFromName,
        fromEmail: resolvedFromEmail,
        replyTo: resolvedReplyTo,
      });
    }

    console.log("=== EMAIL SENT SUCCESSFULLY ===");
    return result;
  } catch (err) {
    console.error("=== EMAIL ERROR ===", err);
    console.error("❌ Email error:", err.message);
    throw err;
  }
};
