import express from "express";
import DemoRequest from "../models/DemoRequest.js";
import Organization from "../models/Organization.js";
import OrgWebsiteContent from "../models/OrgWebsiteContent.js";
import {
  sendDemoLeadNotification,
  sendDemoMeetingScheduledNotification,
} from "../services/notification-email.service.js";
import { trackOnboardingEvent } from "../services/onboarding-event.service.js";
import { sendPushToRole } from "../services/push.service.js";

const router = express.Router();
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/[^\d+]/g, "");
const normalizeSlug = (value) => normalizeText(value).toLowerCase().replace(/[^a-z0-9-]/g, "");
const normalizeMeetingProvider = (value = "") => {
  const cleaned = String(value || "").trim().toLowerCase();
  if (!cleaned) return "other";
  if (cleaned.includes("google")) return "google";
  if (cleaned.includes("zoom")) return "zoom";
  return "other";
};

async function verifyTurnstileToken(token, req) {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { verified: true, skipped: true };
  }

  if (!token || typeof token !== "string") {
    return { verified: false, skipped: false };
  }

  try {
    const formData = new URLSearchParams();
    formData.set("secret", secret);
    formData.set("response", token);

    const forwardedFor = req.headers["x-forwarded-for"];
    const remoteIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : req.ip;

    if (remoteIp) {
      formData.set("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      return { verified: false, skipped: false };
    }

    const result = await response.json();
    return {
      verified: Boolean(result?.success),
      skipped: false,
      errors: Array.isArray(result?.["error-codes"]) ? result["error-codes"] : [],
    };
  } catch (error) {
    console.error("[Turnstile] Verification error:", error.message);
    return { verified: false, skipped: false };
  }
}

function getFirstGalleryImage(site) {
  return site?.gallery?.images?.find((item) => item?.image)?.image || "";
}

function platformAuthBranding() {
  return {
    success: true,
    branding: {
      authType: "platform",
      name: "ClassGrid",
      shortName: "ClassGrid",
      tagline: "Smart campus operations for modern institutions.",
      logoUrl: "/logos/logo.png",
      campusImageUrl: "",
      leftVariant: "default",
      subdomain: "",
    },
  };
}

/**
 * GET /api/public/auth-branding
 * Public-safe branding for login screens. Uses tenant subdomain first, then ?slug=.
 */
router.get("/auth-branding", async (req, res) => {
  try {
    const requestedType = normalizeText(req.query?.type) || "institution";
    const slug = normalizeSlug(req.tenantSlug || req.query?.slug);
    const domainParam = req.query?.domain;

    const query = [];
    if (slug) query.push({ subdomain: slug });
    if (req.tenantHost) {
      query.push({ "custom_domain.domain": req.tenantHost });
      query.push({ "erp_domain.domain": req.tenantHost });
    }
    if (domainParam) {
      query.push({ "custom_domain.domain": domainParam });
      query.push({ "erp_domain.domain": domainParam });
    }

    if (query.length === 0) {
      if (requestedType === "institution") {
        return res.status(404).json({ success: false, message: "Institution not found." });
      }
      return res.json(platformAuthBranding());
    }

    const org = await Organization.findOne({ $or: query })
      .select("name subdomain logo_url favicon_url campus_photo_url social_links branding status custom_domain erp_domain site_title")
      .lean();

    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found." });
    }

    if (org.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This institution portal is currently unavailable.",
      });
    }

    const site = await OrgWebsiteContent.findOne({
      $or: [{ org_slug: slug }, { organization_id: org._id }],
    })
      .select("institution hero storyImage gallery")
      .lean();

    const campusImageUrl =
      org.campus_photo_url ||
      site?.institution?.heroImage ||
      site?.hero?.fallbackImage ||
      site?.storyImage ||
      getFirstGalleryImage(site);

    const logoUrl = org.logo_url || site?.institution?.logoUrl || "";
    const tagline =
      org.branding?.tagline ||
      site?.institution?.tagline ||
      site?.hero?.subHeadline ||
      "Smart Campus. Better Learning.";

    // For login branding, use erp_domain (the domain students/faculty use).
    // Fall back to custom_domain for backwards compatibility.
    const erpDomain = org.erp_domain;
    const mktDomain = org.custom_domain;
    // The "active" ERP domain is used for login redirects and branding
    const activeErpDomain = (erpDomain?.status === "verified" || erpDomain?.status === "active") ? erpDomain?.domain : null;
    // The "active" marketing domain (for reference only)
    const activeMktDomain = (mktDomain?.status === "verified" || mktDomain?.status === "active") ? mktDomain?.domain : null;

    return res.json({
      success: true,
      branding: {
        authType: requestedType === "platform" ? "platform" : "institution",
        name: org.name,
        shortName: site?.institution?.shortName || org.name,
        tagline,
        logoUrl,
        faviconUrl: org.favicon_url || "",
        campusImageUrl,
        leftVariant: campusImageUrl ? "image" : "default",
        subdomain: org.subdomain,
        // customDomain = ERP domain (used for login redirect when classgrid URL is disabled)
        customDomain: activeErpDomain || activeMktDomain,
        allowClassgridUrl: erpDomain?.allow_classgrid_url !== false,
        isCustomDomainEnabled: erpDomain?.is_enabled !== false,
        // Also expose the marketing domain separately
        marketingDomain: activeMktDomain,
        siteTitle: org.site_title || "Classgrid ERP",
        socialLinks: org.social_links || {},
      },
    });
  } catch (error) {
    console.error("[Public] auth-branding error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load login branding.",
    });
  }
});

/**
 * POST /api/public/request-demo - Receive demo leads from marketing site
 */
router.post("/request-demo", async (req, res) => {
  try {
    const payload = {
      institutionName: normalizeText(req.body?.institutionName),
      orgType: normalizeText(req.body?.orgType),
      adminName: normalizeText(req.body?.adminName),
      adminEmail: normalizeEmail(req.body?.adminEmail),
      adminPhone: normalizePhone(req.body?.adminPhone),
      state: normalizeText(req.body?.state),
      city: normalizeText(req.body?.city),
      message: normalizeText(req.body?.message),
      turnstileToken: normalizeText(req.body?.turnstileToken),
    };

    if (
      !payload.institutionName ||
      !payload.orgType ||
      !payload.adminName ||
      !payload.adminEmail ||
      !payload.adminPhone ||
      !payload.state ||
      !payload.city
    ) {
      return res.status(400).json({ message: "Missing required fields for demo request." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.adminEmail)) {
      return res.status(400).json({ message: "Please enter a valid admin email address." });
    }

    if (!/^\+?\d{10,15}$/.test(payload.adminPhone)) {
      return res.status(400).json({ message: "Please enter a valid admin phone number." });
    }

    const turnstileResult = await verifyTurnstileToken(payload.turnstileToken, req);
    if (!turnstileResult.verified) {
      return res.status(400).json({
        message: "Security verification failed. Please retry the form submission.",
      });
    }

    const demoRequest = await DemoRequest.create({
      institutionName: payload.institutionName,
      orgType: payload.orgType,
      adminName: payload.adminName,
      adminEmail: payload.adminEmail,
      adminPhone: payload.adminPhone,
      state: payload.state,
      city: payload.city,
      message: payload.message,
      status: "new",
      lifecycleStage: "lead_created",
    });

    await trackOnboardingEvent({
      demoRequestId: demoRequest._id,
      eventType: "lead_created",
      stage: "lead_created",
      actorRole: "public",
      metadata: {
        institutionName: demoRequest.institutionName,
        orgType: demoRequest.orgType,
      },
    });

    await sendDemoLeadNotification({
      demoRequest,
      bookingUrl: process.env.DEMO_BOOKING_URL || process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || "",
    });

    // Send Web Push to Super Admins
    await sendPushToRole("super_admin", {
      title: "New Demo Request",
      body: `${demoRequest.institutionName} requested a demo!`,
      url: `/superadmin/marketing/demo-leads`
    }).catch(err => console.error("Web Push Error:", err));

    return res.status(201).json({
      success: true,
      requestId: demoRequest._id.toString(),
      message: "Demo request received successfully.",
    });
  } catch (error) {
    console.error("[Public] Demo request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit demo request. Please try again.",
    });
  }
});

/**
 * POST /api/public/request-demo/:id/meeting-booked
 * Used by marketing success flow when the institution confirms a booked slot.
 * Optional security: set DEMO_SCHEDULER_WEBHOOK_SECRET and send it as x-demo-scheduler-secret.
 */
router.post("/request-demo/:id/meeting-booked", async (req, res) => {
  try {
    const leadId = normalizeText(req.params?.id);
    if (!/^[a-f\d]{24}$/i.test(leadId)) {
      return res.status(400).json({ success: false, message: "Invalid demo request id." });
    }

    const expectedSecret = normalizeText(process.env.DEMO_SCHEDULER_WEBHOOK_SECRET);
    if (expectedSecret) {
      const schedulerHeader = req.headers["x-demo-scheduler-secret"];
      const receivedSecret = Array.isArray(schedulerHeader)
        ? normalizeText(schedulerHeader[0])
        : normalizeText(schedulerHeader);
      if (!receivedSecret || receivedSecret !== expectedSecret) {
        return res.status(401).json({ success: false, message: "Unauthorized scheduler callback." });
      }
    }

    const scheduledAtRaw = normalizeText(req.body?.scheduledAt);
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ success: false, message: "Valid scheduledAt is required." });
    }

    const provider = normalizeMeetingProvider(req.body?.provider);
    const timezone = normalizeText(req.body?.timezone) || "Asia/Kolkata";
    const meetingUrl = normalizeText(req.body?.meetingUrl);
    const meetingId = normalizeText(req.body?.meetingId);
    const notes = normalizeText(req.body?.notes);

    const lead = await DemoRequest.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Demo lead not found." });
    }

    lead.meetingStatus = "scheduled";
    lead.meetingProvider = provider;
    lead.meetingScheduledAt = scheduledAt;
    lead.meetingTimezone = timezone;
    lead.meetingUrl = meetingUrl;
    lead.meetingId = meetingId;
    lead.meetingNotes = notes;
    lead.meetingScheduledByUserId = null;
    lead.meetingScheduledBySource = "self_schedule";

    if (lead.status === "new") {
      lead.status = "contacted";
    }
    lead.lifecycleStage = "meeting_scheduled";

    await lead.save();
    await trackOnboardingEvent({
      demoRequestId: lead._id,
      eventType: "meeting_scheduled",
      stage: "meeting_scheduled",
      actorRole: "public",
      metadata: {
        provider,
        timezone,
      },
    });

    await sendDemoMeetingScheduledNotification({
      demoRequest: lead,
      meetingDetails: {
        provider,
        scheduledAt,
        timezone,
        meetingUrl,
        notes,
      },
      scheduledBy: "self_schedule",
    });

    return res.status(200).json({
      success: true,
      message: "Meeting details received and email notifications queued.",
      requestId: lead._id.toString(),
    });
  } catch (error) {
    console.error("[Public] meeting-booked error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save meeting details.",
    });
  }
});

export default router;



