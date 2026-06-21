import { enqueueEmail } from "./email-queue.service.js";

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getMarketingSiteUrl() {
    return (
        process.env.MARKETING_SITE_URL?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        process.env.PUBLIC_SITE_URL?.trim() ||
        process.env.FRONTEND_URL?.trim() ||
        (process.env.NODE_ENV === "production"
            ? "https://classgrid.in"
            : "http://localhost:3000")
    ).replace(/\/$/, "");
}

function formatReplyBody(message) {
    return escapeHtml(message).replace(/\r?\n/g, "<br>");
}

function buildTicketReplyEmailHtml({ ticket, replyMessage, conversationUrl }) {
    const currentYear = new Date().getFullYear();
    const subject = ticket.subject || "Support ticket";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply on Your Support Ticket</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, html {
      margin: 0; padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f0f0f;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#0f0f0f;width:100%;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#161616;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin:0 auto;max-width:600px;width:100%;">
<tr>
<td style="padding:30px;border-bottom:1px solid #2a2a2a;text-align:center;">
<img src="https://classgrid.in/Classgrid.png" alt="Classgrid" width="48" height="48" style="display:block;margin:0 auto 16px;border-radius:6px;">
<h1 style="color:#ffffff;margin:0;font-size:22px;">New Reply on Your Support Ticket</h1>
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">Classgrid Support has replied to your request.</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;line-height:1.3;">${escapeHtml(subject)}</h2>
<p style="color:#9ca3af;font-size:12px;margin:0 0 20px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Ticket #${escapeHtml(String(ticket._id).slice(0, 8))}</p>
<div style="padding:18px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;text-align:center;">
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0;">You have received a new message from our team regarding this request.</p>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:10px 0 0;">Please log in to our support portal to read the full message and continue the conversation.</p>
</div>
<div style="text-align:center;margin:30px 0;">
<a href="${escapeHtml(conversationUrl)}" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">View Full Conversation</a>
</div>

<div style="margin-top:30px;text-align:center;">
<p style="color:#9ca3af;font-size:13px;margin:0;">
Need help? Contact <a href="mailto:support@classgrid.in" style="color:#ffffff;text-decoration:none;">support@classgrid.in</a>
</p>
</div>
</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;color:#7a7a7a;font-size:12px;">
<p style="margin-bottom:8px;color:#7a7a7a;font-size:12px;">You received this because you opened a Classgrid support ticket.</p>
&copy; ${currentYear} Classgrid. All rights reserved.
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildTicketReplyPlainText({ ticket, replyMessage, conversationUrl }) {
    return [
        "New Reply on Your Support Ticket",
        "",
        ticket.subject || "Support ticket",
        "",
        "You have received a new message from our team regarding this request.",
        "Please log in to our support portal to read the full message and continue the conversation.",
        "",
        `View full conversation: ${conversationUrl}`,
        "",
        "Classgrid Support"
    ].join("\n");
}

export async function notifyTicketCreatorOfAdminReply({ ticket, replyMessage }) {
    const to = ticket?.submitterEmail?.trim();
    if (!to) return { queued: false, reason: "missing_submitter_email" };

    const siteUrl = getMarketingSiteUrl();
    const conversationUrl = `${siteUrl}/support/requests/${ticket._id}?email=${encodeURIComponent(to)}`;
    const subject = `New reply: ${ticket.subject || "Support ticket"} | Classgrid`;

    const job = await enqueueEmail({
        to,
        subject,
        html: buildTicketReplyEmailHtml({ ticket, replyMessage, conversationUrl }),
        text: buildTicketReplyPlainText({ ticket, replyMessage, conversationUrl }),
        type: "support_ticket_reply",
        userId: ticket.submittedBy || null,
        organizationId: ticket.organization_id || null,
    });

    return { queued: Boolean(job), jobId: job?._id, conversationUrl };
}

function buildTicketCreationEmailHtml({ ticket, trackingUrl }) {
    const currentYear = new Date().getFullYear();
    const subject = ticket.subject || "Support ticket";
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const category = ticket.category || "general";
    const priority = ticket.priority || "medium";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Support Ticket Has Been Created</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, html {
      margin: 0; padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f0f0f;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#0f0f0f;width:100%;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#161616;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin:0 auto;max-width:600px;width:100%;">
<tr>
<td style="padding:30px;border-bottom:1px solid #2a2a2a;text-align:center;">
<img src="https://classgrid.in/Classgrid.png" alt="Classgrid" width="48" height="48" style="display:block;margin:0 auto 16px;border-radius:6px;">
<h1 style="color:#ffffff;margin:0;font-size:22px;">Your Support Ticket Has Been Created</h1>
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">We've received your request and our team will get back to you soon.</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;line-height:1.3;">${escapeHtml(subject)}</h2>
<p style="color:#9ca3af;font-size:12px;margin:0 0 20px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Ticket #${escapeHtml(ticketIdShort)}</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;">
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;">
<span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Category</span><br>
<span style="color:#ffffff;font-size:14px;font-weight:500;">${escapeHtml(category.charAt(0).toUpperCase() + category.slice(1))}</span>
</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;">
<span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Priority</span><br>
<span style="color:#ffffff;font-size:14px;font-weight:500;">${escapeHtml(priority.charAt(0).toUpperCase() + priority.slice(1))}</span>
</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;">
<span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Status</span><br>
<span style="color:#34d399;font-size:14px;font-weight:600;">Open</span>
</td>
</tr>
</table>

<div style="padding:18px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;text-align:center;">
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0;">Our support team has been notified and will review your request shortly.</p>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:10px 0 0;">You can track your ticket status and reply to our team using the button below.</p>
</div>

<div style="text-align:center;margin:30px 0;">
<a href="${escapeHtml(trackingUrl)}" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">Track Your Ticket</a>
</div>

<div style="margin-top:30px;text-align:center;">
<p style="color:#9ca3af;font-size:13px;margin:0;">
Need help? Contact <a href="mailto:support@classgrid.in" style="color:#ffffff;text-decoration:none;">support@classgrid.in</a>
</p>
</div>
</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;color:#7a7a7a;font-size:12px;">
<p style="margin-bottom:8px;color:#7a7a7a;font-size:12px;">You received this because you submitted a support request on Classgrid.</p>
&copy; ${currentYear} Classgrid. All rights reserved.
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildTicketCreationPlainText({ ticket, trackingUrl }) {
    return [
        "Your Support Ticket Has Been Created",
        "",
        `Subject: ${ticket.subject || "Support ticket"}`,
        `Ticket ID: #${String(ticket._id).slice(0, 8)}`,
        `Category: ${ticket.category || "general"}`,
        `Priority: ${ticket.priority || "medium"}`,
        "",
        "Our support team has been notified and will review your request shortly.",
        "You can track your ticket status and reply to our team using the link below.",
        "",
        `Track your ticket: ${trackingUrl}`,
        "",
        "Classgrid Support"
    ].join("\n");
}

export async function notifyUserOfTicketCreation({ ticket }) {
    const to = ticket?.submitterEmail?.trim();
    if (!to) return { queued: false, reason: "missing_submitter_email" };

    const siteUrl = getMarketingSiteUrl();
    const trackingUrl = `${siteUrl}/support/requests/${ticket._id}?email=${encodeURIComponent(to)}`;
    const subject = `Ticket received: ${ticket.subject || "Support ticket"} | Classgrid`;

    const job = await enqueueEmail({
        to,
        subject,
        html: buildTicketCreationEmailHtml({ ticket, trackingUrl }),
        text: buildTicketCreationPlainText({ ticket, trackingUrl }),
        type: "support_ticket_new",
        userId: ticket.submittedBy || null,
        organizationId: ticket.organization_id || null,
    });

    return { queued: Boolean(job), jobId: job?._id, trackingUrl };
}
