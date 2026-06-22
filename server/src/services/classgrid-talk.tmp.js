
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
<li style="margin-bottom:10px;">📘 <a href="https://classgrid.in/case-studies" style="color:#34d399;text-decoration:none;">See Case Studies</a> – Real success stories from similar institutions</li>
<li style="margin-bottom:10px;">🎥 <a href="https://classgrid.in/demo" style="color:#34d399;text-decoration:none;">Product Demo Videos</a> – Watch Classgrid in action</li>
<li style="margin-bottom:10px;">📊 <a href="https://classgrid.in/features" style="color:#34d399;text-decoration:none;">Feature Overview</a> – Understand our core capabilities</li>
</ul>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Have Questions in the Meantime?</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 5px;">You can always reach our Classgrid Talk team directly:</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0 0 30px;">📧 <a href="mailto:talk@classgrid.in" style="color:#34d399;text-decoration:none;">talk@classgrid.in</a><br><span style="color:#9ca3af;font-size:12px;">(Please include your Request ID #CG-TALK-${escapeHtml(ticketIdShort)} for faster routing.)</span></p>

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
  <a href="https://classgrid.in/about" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">About Us</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because you submitted a request through Classgrid Talk. If you did not initiate this, please contact us at talk@classgrid.in.</p>
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
    "- See Case Studies: https://classgrid.in/case-studies",
    "- Product Demo Videos: https://classgrid.in/demo",
    "- Feature Overview: https://classgrid.in/features",
    "",
    "HAVE QUESTIONS IN THE MEANTIME?",
    `You can always reach our Classgrid Talk team directly at talk@classgrid.in (Please include your Request ID #CG-TALK-${ticketIdShort} for faster routing.)`,
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

export function buildTalkRequestReplyEmailHtml({ ticket, replyMessage, conversationUrl }) {
  const currentYear = new Date().getFullYear();
  const ticketIdShort = String(ticket._id).slice(0, 8);
  const userName = ticket.submitterName || "Prospect";
  const specialistName = ticket.assignedToName || "Your Classgrid Talk Specialist";

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
  <p style="color:#e5e5e5;font-size:15px;line-height:1.6;margin:0;white-space:pre-wrap;">${formatReplyBody(replyMessage)}</p>
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

</div>

<div style="padding:20px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 30px;">
  <h3 style="color:#ffffff;font-size:15px;margin:0 0 8px;">Your Dedicated Specialist</h3>
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 5px;"><strong>${escapeHtml(specialistName)}</strong></p>
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 5px;">📧 talk@classgrid.in</p>
  <p style="color:#e5e5e5;font-size:14px;margin:0 0 0;">🕒 Available: Mon–Fri, 9 AM – 6 PM IST</p>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Helpful Reminders</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;width:40%;">Share your timeline</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">Helps us tailor the conversation to your decision cycle</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">Mention key pain points</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">We can focus on what matters most to you</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">Involve your team</td>
<td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#cccccc;font-size:14px;">Feel free to CC colleagues – we're happy to include them</td>
</tr>
<tr>
<td style="padding:10px 0;color:#ffffff;font-size:14px;font-weight:600;">No pressure</td>
<td style="padding:10px 0;color:#cccccc;font-size:14px;">This is an exploratory conversation, not a sales pitch</td>
</tr>
</table>

<div style="padding:20px;background:#161616;border-radius:10px;border:1px dashed #34d399;margin:0 0 30px;text-align:center;">
  <h3 style="color:#34d399;font-size:15px;margin:0 0 8px;">Not a platform user? No problem.</h3>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 10px;">We understand you're evaluating Classgrid and haven't signed up yet. This conversation is designed to give you clarity, not commitment.</p>
  <p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0;">If at any point you'd like to pause or stop the conversation, just let us know – we respect your time.</p>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Need Additional Help?</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;list-style-type:none;padding:0;">
<li style="margin-bottom:10px;">📧 <strong><a href="mailto:talk@classgrid.in" style="color:#34d399;text-decoration:none;">talk@classgrid.in</a></strong> – For any administrative questions</li>
<li style="margin-bottom:10px;">💬 <strong>Live Chat:</strong> Available on our website during business hours</li>
</ul>

<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">We're here to make your evaluation process smooth and insightful. Looking forward to connecting further!</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0;">Best regards,<br><strong>The Classgrid Talk Team</strong></p>

</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;">
<p style="margin:0 0 10px;">
  <a href="https://classgrid.in" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Website</a> | 
  <a href="https://classgrid.in/about" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">About Us</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because you're in conversation with Classgrid Talk. If you no longer wish to receive these updates, reply with "UNSUBSCRIBE" or contact talk@classgrid.in.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function buildTalkRequestReplyPlainText({ ticket, replyMessage, conversationUrl }) {
  const ticketIdShort = String(ticket._id).slice(0, 8);
  const userName = ticket.submitterName || "Prospect";
  const specialistName = ticket.assignedToName || "Your Classgrid Talk Specialist";

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
    replyMessage,
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
    "Email: talk@classgrid.in",
    "Available: Mon–Fri, 9 AM – 6 PM IST",
    "",
    "HELPFUL REMINDERS",
    "- Share your timeline: Helps us tailor the conversation to your decision cycle",
    "- Mention key pain points: We can focus on what matters most to you",
    "- Involve your team: Feel free to CC colleagues – we're happy to include them",
    "- No pressure: This is an exploratory conversation, not a sales pitch",
    "",
    "NOT A PLATFORM USER? NO PROBLEM.",
    "We understand you're evaluating Classgrid and haven't signed up yet. This conversation is designed to give you clarity, not commitment.",
    "If at any point you'd like to pause or stop the conversation, just let us know – we respect your time.",
    "",
    "NEED ADDITIONAL HELP?",
    "Email: talk@classgrid.in – For any administrative questions",
    "Live Chat: Available on our website during business hours",
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

export async function notifyTalkCreatorOfAdminReply({ ticket, replyMessage }) {
  const to = ticket?.submitterEmail?.trim();
  if (!to) return { queued: false, reason: "missing_submitter_email" };

  const siteUrl = getMarketingSiteUrl();
  const conversationUrl = `${siteUrl}/talk/requests/${ticket._id}?email=${encodeURIComponent(to)}`;
  const ticketIdShort = String(ticket._id).slice(0, 8);
  const subject = `New Message from Your Classgrid Talk Specialist – Request #CG-TALK-${ticketIdShort}`;

  const job = await enqueueEmail({
    to,
    subject,
    html: buildTalkRequestReplyEmailHtml({ ticket, replyMessage, conversationUrl }),
    text: buildTalkRequestReplyPlainText({ ticket, replyMessage, conversationUrl }),
    type: "talk_request_reply",
    userId: ticket.submittedBy || null,
    organizationId: ticket.organization_id || null,
  });

  return { queued: Boolean(job), jobId: job?._id, conversationUrl };
}
