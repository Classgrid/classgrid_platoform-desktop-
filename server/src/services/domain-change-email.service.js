/**
 * Security notifications for Classgrid-managed and external domain changes.
 * Domain operations must not fail just because a notification cannot be queued;
 * callers log queue failures and continue with the already-authorized change.
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
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function detailRowsHtml(details) {
    return Object.entries(details)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => `
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#9ca3af;width:34%;">${escapeHtml(label)}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;color:#ffffff;font-weight:600;word-break:break-word;">${escapeHtml(value)}</td>
            </tr>`)
        .join("");
}

function buildNotificationHtml({ title, orgName, adminName, summary, details, actionUrl, actionLabel, note, changedAt }) {
    const year = new Date().getFullYear();
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:36px 12px;background:#0f0f0f;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161616;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px;border-bottom:1px solid #2a2a2a;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">${escapeHtml(title)}</h1>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">${escapeHtml(orgName)}</p>
        </td></tr>
        <tr><td style="padding:28px;color:#d1d5db;font-size:14px;line-height:1.7;">
          <p style="margin:0 0 14px;color:#f3f4f6;">Hello ${escapeHtml(adminName || "Admin")},</p>
          <p style="margin:0 0 22px;">${escapeHtml(summary)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:9px;overflow:hidden;">
            ${detailRowsHtml({ ...details, "Changed at": formatDate(changedAt) })}
          </table>
          ${note ? `<div style="margin:0 0 22px;padding:15px;background:#1c1007;border:1px solid #78350f;border-radius:8px;color:#fde68a;">${escapeHtml(note)}</div>` : ""}
          ${actionUrl ? `<div style="text-align:center;margin:0 0 24px;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 24px;background:#34d399;color:#07110d;text-decoration:none;border-radius:7px;font-weight:700;">${escapeHtml(actionLabel || "Open Classgrid")}</a></div>` : ""}
          <p style="margin:0 0 16px;">If you did not authorize this change, contact Classgrid support immediately.</p>
          <p style="margin:0;color:#f3f4f6;">Regards,<br><strong>The Classgrid Team</strong></p>
        </td></tr>
        <tr><td style="padding:18px;text-align:center;border-top:1px solid #2a2a2a;background:#111111;color:#737373;font-size:11px;">
          &copy; ${year} Classgrid. This security notification was sent because a domain setting changed on your organization account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNotificationText({ title, orgName, adminName, summary, details, actionUrl, note, changedAt }) {
    const rows = Object.entries({ ...details, "Changed at": formatDate(changedAt) })
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => `${label}: ${value}`);

    return [
        title,
        "",
        `Hello ${adminName || "Admin"},`,
        "",
        summary,
        "",
        `Organization: ${orgName}`,
        ...rows,
        note ? `\nImportant: ${note}` : "",
        actionUrl ? `\nOpen Classgrid: ${actionUrl}` : "",
        "",
        "If you did not authorize this change, contact Classgrid support immediately.",
        "",
        "Regards,",
        "The Classgrid Team",
    ].filter(Boolean).join("\n");
}

async function queueDomainEmail({ to, subject, template, organizationId, userId }) {
    if (!to) return { queued: false, reason: "missing_admin_email" };

    const job = await enqueueEmail({
        to,
        subject,
        html: buildNotificationHtml(template),
        text: buildNotificationText(template),
        type: "domain_change",
        channel: "notification",
        userId: userId || null,
        organizationId: organizationId || null,
    });

    return { queued: Boolean(job), jobId: job?._id || null };
}

/** Notify an administrator after their orgname.classgrid.in slug changes. */
export async function notifyDomainChange({
    to,
    orgName,
    adminName,
    adminEmail,
    oldDomain,
    newDomain,
    organizationId,
    userId,
}) {
    const oldHost = oldDomain && oldDomain !== "none" ? `${oldDomain}.classgrid.in` : "Not previously assigned";
    const newHost = `${newDomain}.classgrid.in`;
    const actionUrl = `https://${newHost}/org/login`;
    const template = {
        title: "Classgrid organization URL changed",
        orgName,
        adminName,
        summary: "Your Classgrid organization URL has changed. The new URL is active immediately.",
        details: {
            "Old URL": oldHost,
            "New URL": newHost,
            "Administrator": adminEmail,
        },
        actionUrl,
        actionLabel: "Open admin login",
        note: oldDomain && oldDomain !== "none"
            ? `The old URL no longer points to this organization. Update bookmarks and shared links. The old name is not described as permanently reserved and may be available under platform rules.`
            : "Share the new URL only with people who should access this organization.",
        changedAt: new Date(),
    };

    return queueDomainEmail({
        to,
        subject: `Classgrid organization URL changed to ${newHost}`,
        template,
        organizationId,
        userId,
    });
}

const ACTION_COPY = {
    registered: {
        title: "External domain registered",
        summary: "An external domain was added to your Classgrid organization and now requires DNS verification.",
    },
    changed: {
        title: "External domain changed",
        summary: "Your external domain was changed. The replacement domain must be verified before it becomes active.",
    },
    verified: {
        title: "External domain verified",
        summary: "Classgrid verified the ownership and routing records for your external domain.",
    },
    settings_updated: {
        title: "External domain access changed",
        summary: "Access settings for your external domain were changed.",
    },
    removed: {
        title: "External domain removed",
        summary: "An external domain was removed from your Classgrid organization.",
    },
};

/**
 * Notify an administrator after an external website or ERP hostname changes.
 * Verification secrets are deliberately never accepted or included here.
 */
export async function notifyExternalDomainChange({
    to,
    orgName,
    adminName,
    adminEmail,
    action,
    domainType,
    oldDomain,
    newDomain,
    oldSettings,
    newSettings,
    brandingReset = false,
    organizationId,
    userId,
}) {
    const copy = ACTION_COPY[action] || {
        title: "External domain updated",
        summary: "An external domain setting changed on your Classgrid organization.",
    };
    const typeLabel = domainType === "erp_domain" ? "ERP login domain" : "Public website domain";
    const activeDomain = newDomain || oldDomain;
    const actionUrl = newDomain ? `https://${newDomain}${domainType === "erp_domain" ? "/org/login" : ""}` : "https://classgrid.in";
    const settingsSummary = (settings) => settings
        ? `Custom domain ${settings.is_enabled === false ? "disabled" : "enabled"}${domainType === "erp_domain" ? `; default Classgrid URL ${settings.allow_classgrid_url === false ? "disabled" : "enabled"}` : ""}`
        : undefined;
    const note = action === "removed" && brandingReset
        ? "Removing a custom domain also resets its associated custom branding by product design. You can add the domain and configure branding again later."
        : action === "changed"
            ? "Existing branding is preserved during an in-place hostname change. DNS ownership and routing must be verified again."
            : action === "registered"
                ? "Do not share the hostname as active until both DNS checks pass."
                : undefined;

    const template = {
        title: copy.title,
        orgName,
        adminName,
        summary: copy.summary,
        details: {
            "Domain type": typeLabel,
            "Old domain": oldDomain,
            "New domain": newDomain,
            "Previous access": settingsSummary(oldSettings),
            "New access": settingsSummary(newSettings),
            "Administrator": adminEmail,
        },
        actionUrl,
        actionLabel: activeDomain ? "Review domain" : "Open Classgrid",
        note,
        changedAt: new Date(),
    };

    return queueDomainEmail({
        to,
        subject: `${copy.title}: ${activeDomain || typeLabel}`,
        template,
        organizationId,
        userId,
    });
}
