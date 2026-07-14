/**
 * domain-change-email.service.js
 * 
 * Sends a notification email to the Org Admin when their Classgrid subdomain is changed.
 * Uses the exact same dark-theme email design as support-ticket-email.service.js.
 * 
 * Includes: old domain, new domain, admin login backdoor URL, and irreversibility warning.
 */

import { enqueueEmail } from "./email-queue.service.js";

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function buildDomainChangeEmailHtml({ orgName, adminName, adminEmail, oldDomain, newDomain, backdoorUrl, changedAt }) {
    const currentYear = new Date().getFullYear();
    const formattedDate = formatDate(changedAt);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domain Changed – ${escapeHtml(orgName)}</title>
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
<img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png" alt="Classgrid" width="48" height="48" style="display:block;margin:0 auto 16px;border-radius:6px;">
<h1 style="color:#ffffff;margin:0;font-size:22px;">⚠️ Domain Changed Successfully</h1>
<p style="color:#9ca3af;margin-top:8px;font-size:13px;">${escapeHtml(orgName)}</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#cccccc;font-size:14px;line-height:1.7;">
<p style="color:#e5e5e5;font-size:15px;margin:0 0 15px;">Dear ${escapeHtml(adminName)},</p>
<p style="color:#cccccc;margin:0 0 15px;">Your Classgrid Organization URL has been successfully changed. This action takes effect <strong style="color:#ffffff;">immediately</strong>.</p>
<p style="color:#cccccc;margin:0 0 30px;">Please review the details below and update any bookmarks, saved links, or shared URLs for your students and staff.</p>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">Domain Change Details</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;margin:0 0 25px;">
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;width:30%;color:#9ca3af;font-size:13px;font-weight:500;">Organization</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(orgName)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Old Domain</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ef4444;font-size:14px;font-weight:600;text-decoration:line-through;">${escapeHtml(oldDomain)}.classgrid.in</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">New Domain</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#34d399;font-size:14px;font-weight:600;">${escapeHtml(newDomain)}.classgrid.in</td>
</tr>
<tr>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Admin Email</td>
<td style="padding:14px 18px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:14px;">${escapeHtml(adminEmail)}</td>
</tr>
<tr>
<td style="padding:14px 18px;border-right:1px solid #2a2a2a;color:#9ca3af;font-size:13px;font-weight:500;">Changed At</td>
<td style="padding:14px 18px;color:#ffffff;font-size:14px;">${escapeHtml(formattedDate)}</td>
</tr>
</table>

<div style="padding:20px;background:#1c1007;border-radius:10px;border:1px solid #78350f;margin:0 0 25px;">
  <p style="color:#fbbf24;font-size:14px;font-weight:700;margin:0 0 10px;">⚠️ IRREVERSIBLE ACTION</p>
  <p style="color:#fde68a;font-size:13px;line-height:1.7;margin:0;">The old domain <strong style="color:#ef4444;text-decoration:line-through;">${escapeHtml(oldDomain)}.classgrid.in</strong> is now permanently dead. It cannot be recovered or re-assigned. All existing bookmarks, login links, and shared URLs pointing to the old domain will stop working immediately.</p>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">🔑 Your New Admin Login URL</h3>
<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 15px;">You can now access your dashboard using your new domain:</p>
<div style="padding:16px 20px;background:#0f2318;border-radius:8px;border:1px solid #14532d;margin:0 0 25px;text-align:center;">
  <a href="https://${escapeHtml(newDomain)}.classgrid.in/org/login" style="color:#34d399;font-size:16px;font-weight:700;text-decoration:none;word-break:break-all;">https://${escapeHtml(newDomain)}.classgrid.in/org/login</a>
</div>

<h3 style="color:#ffffff;font-size:16px;margin:0 0 15px;text-transform:uppercase;letter-spacing:0.5px;">What You Should Do Now</h3>
<ul style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 30px;padding-left:20px;">
<li style="margin-bottom:10px;"><strong>Update all shared links:</strong> Notify students, faculty, and staff about the new domain URL.</li>
<li style="margin-bottom:10px;"><strong>Bookmark your new URL:</strong> Save the new admin login link above for quick access.</li>
<li style="margin-bottom:10px;"><strong>Test the new domain:</strong> Visit your new URL in the browser to verify everything works.</li>
</ul>

<div style="text-align:center;margin:0 0 30px;">
<a href="https://${escapeHtml(newDomain)}.classgrid.in/org/login" style="background:#34d399;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;display:inline-block;">👉 Login to Admin Dashboard</a>
</div>

<p style="color:#cccccc;font-size:14px;line-height:1.7;margin:0 0 20px;">If you did not authorize this change, please contact Classgrid support immediately.</p>
<p style="color:#e5e5e5;font-size:14px;line-height:1.7;margin:0;">Warm regards,<br><strong>The Classgrid Team</strong></p>

</td>
</tr>
<tr>
<td style="padding:20px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;">
<p style="margin:0 0 10px;">
  <a href="https://classgrid.in" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Website</a> | 
  <a href="https://classgrid.in/privacy" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a> | 
  <a href="https://classgrid.in/terms" style="color:#9ca3af;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a>
</p>
<p style="color:#7a7a7a;font-size:11px;line-height:1.5;margin:0;">&copy; ${currentYear} Classgrid. All rights reserved.<br>You received this email because a domain change was made to your organization's Classgrid account. If you did not initiate this change, please contact us immediately.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function buildDomainChangePlainText({ orgName, adminName, adminEmail, oldDomain, newDomain, backdoorUrl, changedAt }) {
    const formattedDate = formatDate(changedAt);
    return [
        `⚠️ Domain Changed – ${orgName}`,
        "",
        `Dear ${adminName},`,
        "",
        "Your Classgrid Organization URL has been successfully changed. This action takes effect IMMEDIATELY.",
        "",
        "DOMAIN CHANGE DETAILS",
        `Organization: ${orgName}`,
        `Old Domain: ${oldDomain}.classgrid.in (DEAD - no longer works)`,
        `New Domain: ${newDomain}.classgrid.in`,
        `Admin Email: ${adminEmail}`,
        `Changed At: ${formattedDate}`,
        "",
        "⚠️ IRREVERSIBLE ACTION",
        `The old domain ${oldDomain}.classgrid.in is now permanently dead. It cannot be recovered.`,
        "All existing bookmarks, login links, and shared URLs pointing to the old domain will stop working immediately.",
        "",
        "🔑 YOUR NEW ADMIN LOGIN URL",
        "You can now access your dashboard using your new domain:",
        backdoorUrl,
        "",
        "WHAT YOU SHOULD DO NOW",
        "- Update all shared links: Notify students, faculty, and staff about the new domain URL.",
        "- Bookmark your new URL: Save the new admin login link for quick access.",
        "- Test the new domain: Visit your new URL in the browser to verify everything works.",
        "",
        "If you did not authorize this change, please contact Classgrid support immediately.",
        "",
        "Warm regards,",
        "The Classgrid Team",
        "",
        "© " + new Date().getFullYear() + " Classgrid. All rights reserved."
    ].join("\n");
}

/**
 * Send domain change notification email to org admin.
 * 
 * @param {Object} params
 * @param {string} params.to - Admin's email address
 * @param {string} params.orgName - Organization name
 * @param {string} params.adminName - Admin's display name
 * @param {string} params.adminEmail - Admin's email (displayed in the email body)
 * @param {string} params.oldDomain - Old subdomain slug (without .classgrid.in)
 * @param {string} params.newDomain - New subdomain slug (without .classgrid.in)
 * @param {string} params.organizationId - Org ID for tracking
 * @param {string} params.userId - Admin user ID for tracking
 */
export async function notifyDomainChange({ to, orgName, adminName, adminEmail, oldDomain, newDomain, organizationId, userId }) {
    if (!to) return { queued: false, reason: "missing_admin_email" };

    const backdoorUrl = `https://${newDomain}.classgrid.in/org/login`;
    const changedAt = new Date();

    const subject = `⚠️ Domain Changed: ${oldDomain}.classgrid.in → ${newDomain}.classgrid.in | ${orgName}`;

    const job = await enqueueEmail({
        to,
        subject,
        html: buildDomainChangeEmailHtml({ orgName, adminName, adminEmail, oldDomain, newDomain, backdoorUrl, changedAt }),
        text: buildDomainChangePlainText({ orgName, adminName, adminEmail, oldDomain, newDomain, backdoorUrl, changedAt }),
        type: "domain_change",
        channel: "notification",
        userId: userId || null,
        organizationId: organizationId || null,
    });

    return { queued: Boolean(job), jobId: job?._id, backdoorUrl };
}
