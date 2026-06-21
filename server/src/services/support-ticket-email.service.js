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
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;line-height:1.3;">${escapeHtml(subject)}</h2>
<p style="color:#9ca3af;font-size:12px;margin:0 0 20px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Ticket #${escapeHtml(String(ticket._id).slice(0, 8))}</p>
<div style="padding:20px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;text-align:left;">
  <p style="color:#e5e5e5;font-size:15px;line-height:1.6;margin:0;">${formatReplyBody(replyMessage)}</p>
</div>
<div style="text-align:center;margin:30px 0;">
<a href="${escapeHtml(conversationUrl)}" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">Reply to Conversation</a>
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
        replyMessage,
        "",
        `Reply to conversation: ${conversationUrl}`,
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
    const userName = ticket.submitterName || "User";
    const userMessage = ticket.message || "No description provided.";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Ticket Confirmation – #${escapeHtml(ticketIdShort)}</title>
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
<h1 style="color:#ffffff;margin:0;font-size:22px;">Support Ticket Confirmation</h1>
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">Ticket #${escapeHtml(ticketIdShort)}</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<p style="color:#e5e5e5;font-size:15px;margin:0 0 15px;">Dear ${escapeHtml(userName)},</p>
<p style="color:#cccccc;margin:0 0 15px;">Thank you for contacting Classgrid Support. This message confirms that we have received your request regarding <strong>"${escapeHtml(subject)}"</strong>. Our technical team has been notified and will begin reviewing your case shortly.</p>
<p style="color:#cccccc;margin:0 0 30px;">We understand that this is a priority matter, and we are committed to resolving it as quickly as possible. You will receive a follow-up response within 24 hours.</p>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Ticket Details</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;">
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;width:30%;color:#9ca3af;font-size:13px;font-weight:500;">Ticket ID</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">#${escapeHtml(ticketIdShort)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Subject</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">${escapeHtml(subject)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Category</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">${escapeHtml(category.charAt(0).toUpperCase() + category.slice(1))}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Priority</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">${escapeHtml(priority.charAt(0).toUpperCase() + priority.slice(1))}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Status</td>
<td style="padding:14px 18px;color:#34d399;font-size:14px;font-weight:600;">Open – Awaiting Agent Assignment</td>
</tr>
</table>

<div style="padding:20px;background:#161616;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;text-align:left;">
  <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;font-weight:600;">Your Original Message</p>
  <p style="color:#e5e5e5;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${formatReplyBody(userMessage)}</p>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">What Happens Next?</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;padding-left:20px;">
<li style="margin-bottom:10px;"><strong>Initial Review:</strong> Our support engineer will analyze your issue and may reach out for additional details.</li>
<li style="margin-bottom:10px;"><strong>Investigation & Resolution:</strong> We will work on identifying the root cause and implementing a fix.</li>
<li style="margin-bottom:10px;"><strong>Solution Delivery:</strong> You will be notified via email once the issue is resolved, or sooner if we need more information.</li>
</ul>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Track Your Ticket</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;text-align:center;">To view the full history, add comments, or upload additional files, please use the secure link below. (This link is unique to your request and should not be shared.)</p>
<div style="text-align:center;margin:0 0 30px;">
<a href="${escapeHtml(trackingUrl)}" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">👉 Track Your Ticket</a>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Additional Resources</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 15px;">While you wait, you may find these self-help resources useful:</p>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;list-style-type:none;padding:0;">
<li style="margin-bottom:10px;">📘 <a href="https://classgrid.in/support" style="color:#34d399;text-decoration:none;">Classgrid Help Center</a> – Browse FAQs and how-to guides</li>
<li style="margin-bottom:10px;">🎥 <a href="https://classgrid.in/resources" style="color:#34d399;text-decoration:none;">Video Tutorials</a> – Step-by-step walkthroughs for common tasks</li>
<li style="margin-bottom:10px;">💬 <strong>Live Chat</strong> – Available Mon–Fri, 9 AM – 6 PM IST</li>
</ul>

<div style="padding:18px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;">
  <h3 style="color:#ffffff;font-size:15px;margin:0 0 8px;">Need to reply?</h3>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0;">Simply respond directly to this email, and your message will be automatically appended to your ticket. For urgent matters, you may also reach us at <a href="mailto:support@classgrid.in" style="color:#34d399;text-decoration:none;">support@classgrid.in</a>.</p>
</div>

<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">We appreciate your patience and trust in Classgrid. Our goal is to make your experience seamless and enjoyable.</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0;">Sincerely,<br><strong>The Classgrid Support Team</strong></p>

</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;">
<p style="margin:0 0 10px;">
  <a href="https://classgrid.in" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Website</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a> | 
  <a href="https://classgrid.in/terms" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because you submitted a support request on Classgrid. If you did not initiate this request, please contact us immediately.</p>
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
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const userName = ticket.submitterName || "User";
    const userMessage = ticket.message || "No description provided.";
    
    return [
        `Support Ticket Confirmation – #${ticketIdShort}`,
        "",
        `Dear ${userName},`,
        "",
        `Thank you for contacting Classgrid Support. This message confirms that we have received your request regarding "${ticket.subject || "Support ticket"}". Our technical team has been notified and will begin reviewing your case shortly.`,
        "",
        "We understand that this is important, and we are committed to resolving it as quickly as possible. You will receive a follow-up response within 24 hours.",
        "",
        "TICKET DETAILS",
        `Ticket ID: #${ticketIdShort}`,
        `Subject: ${ticket.subject || "Support ticket"}`,
        `Category: ${ticket.category || "general"}`,
        `Priority: ${ticket.priority || "medium"}`,
        "Status: Open – Awaiting Agent Assignment",
        "",
        "YOUR ORIGINAL MESSAGE",
        userMessage,
        "",
        "WHAT HAPPENS NEXT?",
        "- Initial Review: Our support engineer will analyze your issue and may reach out for additional details.",
        "- Investigation & Resolution: We will work on identifying the root cause and implementing a fix.",
        "- Solution Delivery: You will be notified via email once the issue is resolved, or sooner if we need more information.",
        "",
        "TRACK YOUR TICKET",
        "To view the full history, add comments, or upload additional files, please use the secure link below:",
        `👉 ${trackingUrl}`,
        "",
        "ADDITIONAL RESOURCES",
        "While you wait, you may find these self-help resources useful:",
        "- Classgrid Help Center: https://classgrid.in/support",
        "- Video Tutorials: https://classgrid.in/resources",
        "- Live Chat: Available Mon–Fri, 9 AM – 6 PM IST",
        "",
        "NEED TO REPLY?",
        "Simply respond directly to this email, and your message will be automatically appended to your ticket. For urgent matters, you may also reach us at support@classgrid.in.",
        "",
        "Sincerely,",
        "The Classgrid Support Team",
        "",
        "© " + new Date().getFullYear() + " Classgrid. All rights reserved."
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
