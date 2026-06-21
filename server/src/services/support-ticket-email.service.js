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

function stripHtml(html = "") {
    return String(html).replace(/<[^>]*>?/gm, '').trim();
}

function buildTicketReplyEmailHtml({ ticket, replyMessage, conversationUrl, adminName, adminAvatar, adminEmail }) {
    const currentYear = new Date().getFullYear();
    const subject = ticket.subject || "Support ticket";
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const specialistName = adminName || "The Classgrid Support Team";
    const specialistEmail = adminEmail?.trim() || "";
    const category = ticket.category || "general";
    const priority = ticket.priority || "medium";
    const userName = ticket.submitterName || "User";
    
    // Formatting dates for history
    const openedDate = new Date(ticket.createdAt || Date.now()).toLocaleString();
    const repliedDate = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply on Your Support Ticket – #${escapeHtml(ticketIdShort)}</title>
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
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">Ticket #${escapeHtml(ticketIdShort)}</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<p style="color:#e5e5e5;font-size:15px;margin:0 0 15px;">Dear ${escapeHtml(userName)},</p>
<p style="color:#cccccc;margin:0 0 30px;">You have received a new reply from the Classgrid Support Team regarding your open ticket. Please review the message below and let us know if you need further assistance.</p>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Ticket Summary</h3>
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
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Status</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#34d399;font-size:14px;font-weight:600;">Open – Awaiting Your Response</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Priority</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">${escapeHtml(priority.charAt(0).toUpperCase() + priority.slice(1))}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Category</td>
<td style="padding:14px 18px;color:#ffffff;font-size:14px;">${escapeHtml(category.charAt(0).toUpperCase() + category.slice(1))}</td>
</tr>
</table>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Support Team Reply</h3>
<div style="padding:20px;background:#161616;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;text-align:left;">
  <div style="color:#e5e5e5;font-size:15px;line-height:1.6;margin:0;">${replyMessage}</div>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">What You Can Do Next</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;padding-left:20px;">
<li style="margin-bottom:10px;"><strong>Reply to this message:</strong> Simply respond to this email, and your reply will be added to the ticket.</li>
<li style="margin-bottom:10px;"><strong>Add additional details:</strong> If you have screenshots, logs, or extra context, attach them to your reply.</li>
<li style="margin-bottom:10px;"><strong>Check ticket status:</strong> Use the button below to view the full conversation history.</li>
<li style="margin-bottom:10px;"><strong>Close the ticket:</strong> Let us know if your issue is resolved. Resolved tickets are automatically closed after 7 days.</li>
</ul>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">View & Reply to Your Ticket</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;text-align:center;">(This link takes you to your secure ticket dashboard where you can view all messages and respond.)</p>
<div style="text-align:center;margin:0 0 30px;">
<a href="${escapeHtml(conversationUrl)}" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">👉 Reply to Conversation</a>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Quick Tips for a Faster Resolution</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;list-style-type:none;padding:0;">
<li style="margin-bottom:10px;">✅ <strong>Be specific</strong> – include error messages, steps to reproduce, and your device/browser info.</li>
<li style="margin-bottom:10px;">✅ <strong>Attach screenshots</strong> – they help us visualize the issue clearly.</li>
<li style="margin-bottom:10px;">✅ <strong>Respond promptly</strong> – if we don't hear back within 48 hours, the ticket may be auto-closed.</li>
</ul>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Need Additional Help?</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;list-style-type:none;padding:0;">
<li style="margin-bottom:10px;">📧 <strong>Email:</strong> <a href="mailto:support@classgrid.in" style="color:#34d399;text-decoration:none;">support@classgrid.in</a></li>
</ul>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Ticket Activity History</h3>
<p style="color:#9ca3af;font-size:13px;line-height:1.7;margin:0 0 5px;"><strong>Opened:</strong> ${escapeHtml(openedDate)} – Initial request submitted</p>
<p style="color:#9ca3af;font-size:13px;line-height:1.7;margin:0 0 5px;"><strong>Replied:</strong> ${escapeHtml(repliedDate)} – Support team sent the above response</p>
<p style="color:#9ca3af;font-size:13px;line-height:1.7;margin:0 0 30px;"><strong>Next Action:</strong> Awaiting your reply</p>

<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">We value your feedback! If you're satisfied with our response so far, please consider rating your support experience once the ticket is resolved.</p>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">Thank you for choosing Classgrid. We're here to help!</p>
<div style="margin-top:10px;">
  <p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0 0 10px;">Warm regards,</p>
  <div style="display:inline-block;text-align:left;">
    ${adminAvatar ? `<img src="${adminAvatar}" alt="${escapeHtml(specialistName)}" style="width:40px;height:40px;border-radius:50%;vertical-align:middle;margin-right:8px;border:2px solid #34d399;object-fit:cover;">` : ''}
    <strong style="color:#e5e5e5;font-size:14px;vertical-align:middle;">${escapeHtml(specialistName)}</strong>
    ${adminAvatar ? `<span style="color:#34d399;font-size:14px;vertical-align:middle;margin-left:4px;" title="Verified Support Staff">✔️</span>` : ''}
    ${specialistEmail ? `<br><a href="mailto:${escapeHtml(specialistEmail)}" style="color:#34d399;font-size:13px;text-decoration:none;">${escapeHtml(specialistEmail)}</a>` : ''}
  </div>
</div>

</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;">
<p style="margin:0 0 10px;">
  <a href="https://classgrid.in" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Website</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a> | 
  <a href="https://classgrid.in/terms" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because you opened a support ticket on Classgrid. If you did not expect this reply or wish to unsubscribe from ticket notifications, please contact us immediately.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildTicketReplyPlainText({ ticket, replyMessage, conversationUrl, adminName, adminEmail }) {
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const userName = ticket.submitterName || "User";
    const category = ticket.category || "general";
    const priority = ticket.priority || "medium";
    
    return [
        `New Reply on Your Support Ticket – #${ticketIdShort}`,
        "",
        `Dear ${userName},`,
        "",
        "You have received a new reply from the Classgrid Support Team regarding your open ticket. Please review the message below and let us know if you need further assistance.",
        "",
        "TICKET SUMMARY",
        `Ticket ID: #${ticketIdShort}`,
        `Subject: ${ticket.subject || "Support ticket"}`,
        "Status: Open – Awaiting Your Response",
        `Priority: ${priority}`,
        `Category: ${category}`,
        "",
        "SUPPORT TEAM REPLY",
        stripHtml(replyMessage),
        "",
        "WHAT YOU CAN DO NEXT",
        "- Reply to this message: Simply respond to this email.",
        "- Add additional details: Attach screenshots or logs to your reply.",
        "- Check ticket status: View the full conversation online.",
        "- Close the ticket: Let us know if your issue is resolved. Resolved tickets are automatically closed after 7 days.",
        "",
        "VIEW & REPLY TO YOUR TICKET",
        `👉 ${conversationUrl}`,
        "",
        "QUICK TIPS FOR A FASTER RESOLUTION",
        "- Be specific – include error messages and context.",
        "- Attach screenshots.",
        "- Respond promptly – inactive tickets may be auto-closed after 48 hours.",
        "",
        "NEED ADDITIONAL HELP?",
        specialistEmail ? `Email: ${specialistEmail}` : "",
        "",
        "Warm regards,",
        "The Classgrid Support Team",
        "",
        "© " + new Date().getFullYear() + " Classgrid. All rights reserved."
    ].join("\n");
}

export async function notifyTicketCreatorOfAdminReply({ ticket, replyMessage, adminName, adminAvatar, adminEmail }) {
    const to = ticket?.submitterEmail?.trim();
    if (!to) return { queued: false, reason: "missing_submitter_email" };

    const siteUrl = getMarketingSiteUrl();
    const conversationUrl = `${siteUrl}/support/requests/${ticket._id}?email=${encodeURIComponent(to)}`;
    const subject = `New reply: ${ticket.subject || "Support ticket"} | Classgrid`;

    const job = await enqueueEmail({
        to,
        subject,
        html: buildTicketReplyEmailHtml({ ticket, replyMessage, conversationUrl, adminName, adminAvatar, adminEmail }),
        text: buildTicketReplyPlainText({ ticket, replyMessage, conversationUrl, adminName, adminEmail }),
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
  <div style="color:#e5e5e5;font-size:14px;line-height:1.6;margin:0;">${userMessage}</div>
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
<li style="margin-bottom:10px;">📘 <a href="https://classgrid.in/help-center" style="color:#34d399;text-decoration:none;">Classgrid Help Center</a> – Browse FAQs and how-to guides</li>
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
        stripHtml(userMessage),
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
        "- Classgrid Help Center: https://classgrid.in/help-center",
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

export function buildTalkRequestCreationEmailHtml({ ticket, trackingUrl }) {
    const currentYear = new Date().getFullYear();
    const subject = ticket.subject || "Classgrid Talk Request";
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const userName = ticket.submitterName || "Prospect";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Classgrid Talk Request – We'll Connect Within 24 Hours</title>
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
<h1 style="color:#ffffff;margin:0;font-size:22px;">Your Classgrid Talk Request Has Been Received</h1>
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">Request #CG-TALK-${escapeHtml(ticketIdShort)}</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<p style="color:#e5e5e5;font-size:15px;margin:0 0 15px;">Dear ${escapeHtml(userName)},</p>
<p style="color:#cccccc;margin:0 0 15px;">Thank you for reaching out to Classgrid Talk – our dedicated program for institutions exploring how Classgrid can support their unique goals.</p>
<p style="color:#cccccc;margin:0 0 30px;">We're excited to learn more about your institution's needs and discuss how we can help.</p>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Request Summary</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;">
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;width:30%;color:#9ca3af;font-size:13px;font-weight:500;">Request ID</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">#CG-TALK-${escapeHtml(ticketIdShort)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Program</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">Classgrid Talk</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Type</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">Product Discovery & Consultation</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Status</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#34d399;font-size:14px;font-weight:600;">Awaiting Specialist Assignment</td>
</tr>
<tr>
<td style="padding:14px 18px;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Response ETA</td>
<td style="padding:14px 18px;color:#ffffff;font-size:14px;">Within 24 hours</td>
</tr>
</table>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">What Happens Next?</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;width:40%;">1. Specialist Assignment</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">A dedicated product specialist will be assigned to your request.</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">2. Initial Outreach</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">You'll receive an email/call from your specialist to understand your needs.</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">3. Personalized Discussion</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">We'll explore your institution's goals, challenges, and how Classgrid can help.</td>
</tr>
<tr>
<td style="padding:10px 0;color:#ffffff;font-size:14px;font-weight:600;">4. Tailored Recommendations</td>
<td style="padding:10px 0;color:#cccccc;font-size:14px;">You'll get a custom walkthrough – no pressure, just insights.</td>
</tr>
</table>

<div style="padding:20px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;">
  <h3 style="color:#ffffff;font-size:15px;margin:0 0 8px;">Meet Your Dedicated Specialist (Coming Soon)</h3>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 10px;">Once assigned, your specialist will introduce themselves with:</p>
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 5px;">📧 Direct email address</p>
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 5px;">📅 Link to book a 1:1 consultation</p>
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 0;">📄 Their role and experience</p>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">While You Wait</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 15px;">Explore how Classgrid empowers institutions like yours:</p>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;list-style-type:none;padding:0;">
<li style="margin-bottom:10px;">🎥 <a href="https://classgrid.in/#demo" style="color:#34d399;text-decoration:none;">Product Demo</a> – Watch Classgrid in action</li>
</ul>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Have Questions in the Meantime?</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 5px;">You can always reach our Classgrid Talk team directly:</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0 0 30px;">📧 <a href="mailto:support@classgrid.in" style="color:#34d399;text-decoration:none;">support@classgrid.in</a><br><span style="color:#9ca3af;font-size:12px;">(Please include your Request ID #CG-TALK-${escapeHtml(ticketIdShort)} for faster routing.)</span></p>

<div style="padding:20px;background:#161616;border-radius:10px;border:1px dashed #34d399;margin:0 0 30px;text-align:center;">
  <h3 style="color:#34d399;font-size:15px;margin:0 0 8px;">A Note for You</h3>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0;">This is not a support ticket – we understand you're not a platform user yet. Think of this as your personalized discovery journey with Classgrid. No obligations. Just conversations.</p>
</div>

<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">We look forward to learning about your institution and exploring how we can partner together.</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0;">Warm regards,<br><strong>The Classgrid Talk Team</strong></p>

</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;">
<p style="margin:0 0 10px;">
  <a href="https://classgrid.in" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Website</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because you submitted a request through Classgrid Talk. If you did not initiate this, please contact us at support@classgrid.in.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function buildTalkRequestCreationPlainText({ ticket, trackingUrl }) {
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const userName = ticket.submitterName || "Prospect";
    
    return [
        "Your Classgrid Talk Request Has Been Received",
        "",
        `Dear ${userName},`,
        "",
        "Thank you for reaching out to Classgrid Talk – our dedicated program for institutions exploring how Classgrid can support their unique goals.",
        "We're excited to learn more about your institution's needs and discuss how we can help.",
        "",
        "REQUEST SUMMARY",
        `Request ID: #CG-TALK-${ticketIdShort}`,
        "Program: Classgrid Talk",
        "Type: Product Discovery & Consultation",
        "Status: Awaiting Specialist Assignment",
        "Response ETA: Within 24 hours",
        "",
        "WHAT HAPPENS NEXT?",
        "1. Specialist Assignment: A dedicated product specialist will be assigned to your request.",
        "2. Initial Outreach: You'll receive an email/call from your specialist to understand your needs.",
        "3. Personalized Discussion: We'll explore your institution's goals, challenges, and how Classgrid can help.",
        "4. Tailored Recommendations: You'll get a custom walkthrough – no pressure, just insights.",
        "",
        "MEET YOUR DEDICATED SPECIALIST (Coming Soon)",
        "Once assigned, your specialist will introduce themselves with a direct email address, a link to book a 1:1 consultation, and their role and experience.",
        "",
        "WHILE YOU WAIT",
        "Explore how Classgrid empowers institutions like yours:",
        "- Product Demo: https://classgrid.in/#demo",
        "",
        "HAVE QUESTIONS IN THE MEANTIME?",
        `You can always reach our Classgrid Talk team directly at support@classgrid.in (Please include your Request ID #CG-TALK-${ticketIdShort} for faster routing.)`,
        "",
        "A NOTE FOR YOU",
        "This is not a support ticket – we understand you're not a platform user yet. Think of this as your personalized discovery journey with Classgrid. No obligations. Just conversations.",
        "",
        "We look forward to learning about your institution and exploring how we can partner together.",
        "",
        "Warm regards,",
        "The Classgrid Talk Team",
        "",
        "© " + new Date().getFullYear() + " Classgrid. All rights reserved."
    ].join("\n");
}

export function buildTalkRequestReplyEmailHtml({ ticket, replyMessage, conversationUrl, adminName, adminAvatar, adminEmail }) {
    const currentYear = new Date().getFullYear();
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const userName = ticket.submitterName || "Prospect";
    const specialistName = adminName || ticket.assignedToName || "Your Classgrid Talk Specialist";
    const specialistEmail = adminEmail?.trim() || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message from Your Classgrid Talk Specialist – Request #CG-TALK-${escapeHtml(ticketIdShort)}</title>
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
<h1 style="color:#ffffff;margin:0;font-size:22px;">New Message from Your Classgrid Talk Specialist</h1>
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">Request #CG-TALK-${escapeHtml(ticketIdShort)}</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<p style="color:#e5e5e5;font-size:15px;margin:0 0 15px;">Dear ${escapeHtml(userName)},</p>
<p style="color:#cccccc;margin:0 0 30px;">Your Classgrid Talk specialist has responded to your conversation. Please review the message below and continue the discussion at your convenience.</p>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Conversation Summary</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;">
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;width:30%;color:#9ca3af;font-size:13px;font-weight:500;">Request ID</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">#CG-TALK-${escapeHtml(ticketIdShort)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Program</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">Classgrid Talk</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Specialist</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">${escapeHtml(specialistName)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Status</td>
<td style="padding:14px 18px;color:#34d399;font-size:14px;font-weight:600;">Awaiting Your Response</td>
</tr>
</table>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Specialist's Message</h3>
<div style="padding:20px;background:#161616;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;text-align:left;">
  <div style="color:#e5e5e5;font-size:15px;line-height:1.6;margin:0;">${replyMessage}</div>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">What You Can Do Next</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;padding-left:20px;">
<li style="margin-bottom:10px;"><strong>Reply directly:</strong> Respond to this email – your message goes straight to your specialist.</li>
<li style="margin-bottom:10px;"><strong>Schedule a call:</strong> Your specialist can share a booking link if you prefer a live conversation.</li>
<li style="margin-bottom:10px;"><strong>Ask follow-up questions:</strong> No question is too small – we're here to help you evaluate.</li>
<li style="margin-bottom:10px;"><strong>Request materials:</strong> Ask for demos, pricing, case studies, or technical docs.</li>
</ul>

<div style="text-align:center;margin:0 0 40px;">
<a href="${escapeHtml(conversationUrl)}" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">👉 Reply to Conversation</a>
<p style="color:#9ca3af;font-size:12px;margin-top:10px;">(This link takes you to your secure ticket dashboard)</p>
</div>

<div style="padding:20px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;text-align:center;">
  <h3 style="color:#ffffff;font-size:15px;margin:0 0 15px;">Your Dedicated Specialist</h3>
  ${adminAvatar ? `<img src="${adminAvatar}" alt="${escapeHtml(specialistName)}" style="width:60px;height:60px;border-radius:50%;margin-bottom:10px;border:2px solid #34d399;object-fit:cover;">` : ''}
  <p style="color:#e5e5e5;font-size:16px;margin:0 0 5px;">
    <strong>${escapeHtml(specialistName)}</strong>
    ${adminAvatar ? `<span style="color:#34d399;font-size:14px;vertical-align:middle;margin-left:4px;" title="Verified Staff">✔️</span>` : ''}
  </p>
  ${specialistEmail ? `<p style="color:#e5e5e5;font-size:14px;margin:0 0 5px;">📧 <a href="mailto:${escapeHtml(specialistEmail)}" style="color:#34d399;text-decoration:none;">${escapeHtml(specialistEmail)}</a></p>` : ''}
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 0;">🕒 Available: Mon–Fri, 9 AM – 6 PM IST</p>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Tips for Your Evaluation</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;width:40%;">Request a Live Demo</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">Ask your specialist for a personalized screen-share walkthrough</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">Set up a Sandbox</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">We can provision a demo classroom for your faculty to test freely</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">Invite Your Faculty</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">Feel free to CC department heads or IT staff on this thread</td>
</tr>
<tr>
<td style="padding:10px 0;color:#ffffff;font-size:14px;font-weight:600;">Explore Core Features</td>
<td style="padding:10px 0;color:#cccccc;font-size:14px;">Deep-dive into Quizzes, Attendance, and Organization Analytics</td>
</tr>
</table>

<div style="padding:20px;background:#161616;border-radius:10px;border:1px dashed #34d399;margin:0 0 30px;text-align:center;">
  <h3 style="color:#34d399;font-size:15px;margin:0 0 8px;">Exploring Classgrid for your institution?</h3>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 10px;">Our team can help you understand how the platform supports admissions, fees, attendance, exams, results, communication, and day-to-day administration.</p>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0;">You can ask about modules, setup, migration, pricing, security, or whether Classgrid fits your institution before making any commitment.</p>
</div>



<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">We're here to make your evaluation process smooth and insightful. Looking forward to connecting further!</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0;">Best regards,<br><strong>The Classgrid Talk Team</strong></p>

</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;">
<p style="margin:0 0 10px;">
  <a href="https://classgrid.in" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Website</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because you're in conversation with Classgrid Talk. If you no longer wish to receive these updates, reply with "UNSUBSCRIBE" or contact support@classgrid.in.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function buildTalkRequestReplyPlainText({ ticket, replyMessage, conversationUrl, adminName, adminEmail }) {
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const userName = ticket.submitterName || "Prospect";
    const specialistName = adminName || ticket.assignedToName || "Your Classgrid Talk Specialist";
    const specialistEmail = adminEmail?.trim() || "";
    
    return [
        `New Message from Your Classgrid Talk Specialist – Request #CG-TALK-${ticketIdShort}`,
        "",
        `Dear ${userName},`,
        "",
        "Your Classgrid Talk specialist has responded to your conversation. Please review the message below and continue the discussion at your convenience.",
        "",
        "CONVERSATION SUMMARY",
        `Request ID: #CG-TALK-${ticketIdShort}`,
        "Program: Classgrid Talk",
        `Specialist: ${specialistName}`,
        "Status: Awaiting Your Response",
        "",
        "SPECIALIST'S MESSAGE",
        stripHtml(replyMessage),
        "",
        "WHAT YOU CAN DO NEXT",
        "- Reply directly: Respond to this email – your message goes straight to your specialist.",
        "- Schedule a call: Your specialist can share a booking link if you prefer a live conversation.",
        "- Ask follow-up questions: No question is too small – we're here to help you evaluate.",
        "- Request materials: Ask for demos, pricing, case studies, or technical docs.",
        "",
        "VIEW & REPLY TO YOUR TICKET",
        `👉 ${conversationUrl}`,
        "",
        "YOUR DEDICATED SPECIALIST",
        specialistName,
        specialistEmail ? `Email: ${specialistEmail}` : "",
        "Available: Mon–Fri, 9 AM – 6 PM IST",
        "",
        "TIPS FOR YOUR EVALUATION",
        "- Request a Live Demo: Ask your specialist for a personalized screen-share walkthrough",
        "- Set up a Sandbox: We can provision a demo classroom for your faculty to test freely",
        "- Invite Your Faculty: Feel free to CC department heads or IT staff on this thread",
        "- Explore Core Features: Deep-dive into Quizzes, Attendance, and Organization Analytics",
        "",
        "EXPLORING CLASSGRID FOR YOUR INSTITUTION?",
        "Our team can help you understand how the platform supports admissions, fees, attendance, exams, results, communication, and day-to-day administration.",
        "You can ask about modules, setup, migration, pricing, security, or whether Classgrid fits your institution before making any commitment.",
        "",

        "We're here to make your evaluation process smooth and insightful. Looking forward to connecting further!",
        "",
        "Best regards,",
        "The Classgrid Talk Team",
        "",
        "© " + new Date().getFullYear() + " Classgrid. All rights reserved."
    ].join("\n");
}

export async function notifyUserOfTalkRequestCreation({ ticket }) {
    const to = ticket?.submitterEmail?.trim();
    if (!to) return { queued: false, reason: "missing_submitter_email" };

    const siteUrl = getMarketingSiteUrl();
    const trackingUrl = `${siteUrl}/talk/requests/${ticket._id}?email=${encodeURIComponent(to)}`;
    const subject = `Your Classgrid Talk Request – We'll Connect Within 24 Hours`;

    const job = await enqueueEmail({
        to,
        subject,
        html: buildTalkRequestCreationEmailHtml({ ticket, trackingUrl }),
        text: buildTalkRequestCreationPlainText({ ticket, trackingUrl }),
        type: "talk_request_new",
        userId: ticket.submittedBy || null,
        organizationId: ticket.organization_id || null,
    });

    return { queued: Boolean(job), jobId: job?._id, trackingUrl };
}

export async function notifyTalkCreatorOfAdminReply({ ticket, replyMessage, adminName, adminAvatar, adminEmail }) {
    const to = ticket?.submitterEmail?.trim();
    if (!to) return { queued: false, reason: "missing_submitter_email" };

    const siteUrl = getMarketingSiteUrl();
    const conversationUrl = `${siteUrl}/talk/requests/${ticket._id}?email=${encodeURIComponent(to)}`;
    const ticketIdShort = String(ticket._id).slice(0, 8);
    const subject = `New Message from Your Classgrid Talk Specialist – Request #CG-TALK-${ticketIdShort}`;

    const job = await enqueueEmail({
        to,
        subject,
        html: buildTalkRequestReplyEmailHtml({ ticket, replyMessage, conversationUrl, adminName, adminAvatar, adminEmail }),
        text: buildTalkRequestReplyPlainText({ ticket, replyMessage, conversationUrl, adminName, adminEmail }),
        type: "talk_request_reply",
        userId: ticket.submittedBy || null,
        organizationId: ticket.organization_id || null,
    });

    return { queued: Boolean(job), jobId: job?._id, conversationUrl };
}

