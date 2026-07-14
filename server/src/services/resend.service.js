/**
 * Classgrid — Resend Email Service
 * 
 * Used for activity notifications via notification@updates.classgrid.in
 * This is separate from Brevo SMTP (used for transactional & support emails).
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFICATION_SENDER = "Classgrid Notifications <notification@updates.classgrid.in>";
const SUPPORT_REPLY_TO = "support@classgrid.in";

/**
 * Send an email via Resend (notification channel)
 */
export const sendViaResend = async ({ to, subject, html, text, replyTo }) => {
  try {
    console.log(`[Resend] Sending to: ${to} | Subject: ${subject}`);

    const result = await resend.emails.send({
      from: NOTIFICATION_SENDER,
      replyTo: replyTo || SUPPORT_REPLY_TO,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const resendId = result.id || result.data?.id;
    console.log(`[Resend] ✅ Email sent to: ${to} | ID: ${resendId}`);
    return { messageId: resendId, provider: "resend" };
  } catch (err) {
    console.error(`[Resend] ❌ Failed to send to ${to}:`, err.message);
    throw err;
  }
};
