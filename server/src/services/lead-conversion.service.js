import crypto from "crypto";
import mongoose from "mongoose";

import DemoRequest from "../models/DemoRequest.js";
import User from "../models/User.js";
import { provisionDemoOrg } from "./provisioning.service.js";
import { enqueueEmail } from "./email-queue.service.js";
import { getPlanLimits } from "./module-toggle.service.js";
import { trackOnboardingEvent } from "./onboarding-event.service.js";
import {
  getConsolidatedApprovalEmailHtml,
  getConsolidatedApprovalEmailPlainText,
} from "./email-templates.service.js";

const generateActivationCredentials = () => {
  const rawActivationToken = crypto.randomBytes(32).toString("hex");
  const hashedActivationToken = crypto
    .createHash("sha256")
    .update(rawActivationToken)
    .digest("hex");

  const activationCode = String(Math.floor(100000 + Math.random() * 900000));
  const activationCodeHash = crypto
    .createHash("sha256")
    .update(activationCode)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  return {
    rawActivationToken,
    hashedActivationToken,
    activationCode,
    activationCodeHash,
    expiresAt,
  };
};

const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim() ||
  (process.env.NODE_ENV === "production" ? "https://classgrid.in" : "https://classgrid.in");

const normalizeOrgType = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return "school";

  if (normalized.includes("engineering")) return "engineering";
  if (normalized.includes("coaching")) return "coaching";
  if (normalized.includes("diploma")) return "diploma";

  const supported = new Set([
    "school",
    "junior_college",
    "coaching",
    "engineering",
    "college",
    "diploma",
    "institute",
    "institutes",
    "other",
  ]);

  return supported.has(normalized) ? normalized : "school";
};

export async function approveLeadAndProvision(demoRequestId, options = {}, actorUserId = null) {
  if (!mongoose.Types.ObjectId.isValid(demoRequestId)) {
    const error = new Error("Invalid demo request id.");
    error.statusCode = 400;
    throw error;
  }

  let lead = await DemoRequest.findOneAndUpdate(
    {
      _id: demoRequestId,
      status: { $ne: "converted" },
      provisionedOrganizationId: null,
      conversionStatus: { $ne: "in_progress" },
    },
    {
      $set: {
        conversionStatus: "in_progress",
        conversionStartedAt: new Date(),
        lifecycleStage: "approved",
        lastConversionError: "",
      },
      $inc: {
        conversionAttemptCount: 1,
      },
    },
    { new: true }
  );

  if (!lead) {
    const existingLead = await DemoRequest.findById(demoRequestId).lean();
    if (!existingLead) {
      const error = new Error("Demo request not found.");
      error.statusCode = 404;
      throw error;
    }

    if (existingLead.status === "converted" || existingLead.provisionedOrganizationId) {
      const error = new Error("This lead has already been converted.");
      error.statusCode = 409;
      throw error;
    }

    const error = new Error("Lead provisioning is already in progress. Please wait before retrying.");
    error.statusCode = 409;
    throw error;
  }

  const orgType = normalizeOrgType(options?.orgType || lead.orgType);
  const structureType =
    String(options?.structureType || orgType)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_") || "school";

  const adminPayload = {
    name: lead.adminName,
    email: lead.adminEmail,
    phone_number: lead.adminPhone,
    phoneNumber: lead.adminPhone,
    role: "org_admin",
  };

  const organizationPayload = {
    name: lead.institutionName,
    subdomain: options?.subdomain,
    org_type: orgType,
    structure_type: structureType,
    city: lead.city,
    state: lead.state,
  };

  try {
    const provisioned = await provisionDemoOrg(adminPayload, organizationPayload);

    const organization = provisioned.organization;
    const admin = await User.findById(provisioned.admin._id);

    if (!admin) {
      const error = new Error("Provisioned admin account not found.");
      error.statusCode = 500;
      throw error;
    }

    // Generate single-use activation link for provisioned principal/admin account.
    const credentials = generateActivationCredentials();

    admin.activationToken = credentials.hashedActivationToken;
    admin.activationTokenExpires = credentials.expiresAt;
    admin.activationCodeHash = credentials.activationCodeHash;
    admin.activationCodeExpires = credentials.expiresAt;
    admin.mustResetPassword = true;
    admin.isEmailVerified = true;
    admin.status = "active";
    await admin.save();

    const activationLink = `${FRONTEND_URL}/admin/activate?token=${credentials.rawActivationToken}`;
    const activationDate = new Date();
    const expiryDate = provisioned?.subscription?.expiresAt || new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    const plan = String(options?.plan || provisioned?.subscription?.plan || "demo").trim().toLowerCase();
    const limits = getPlanLimits(plan);
    const warnings = [];

    const subject = "Activate Your Classgrid Admin Account";

    lead.status = "converted";
    lead.convertedAt = new Date();
    lead.convertedBy = actorUserId || null;
    lead.provisionedOrganizationId = organization._id;
    lead.provisionedAdminId = admin._id;
    lead.conversionStatus = "provisioned";
    lead.lifecycleStage = "provisioned";
    lead.conversionCompletedAt = new Date();
    lead.lastConversionError = "";

    try {
      await enqueueEmail({
        to: lead.adminEmail,
        subject,
        html: getConsolidatedApprovalEmailHtml({
          adminName: lead.adminName,
          orgName: organization.name,
          organizationCode: organization.organizationCode,
          honorCode: organization.honorCode,
          plan,
          studentLimit: limits.max_students,
          activationLink,
          activationCode: credentials.activationCode,
          activationDate,
          expiryDate,
          planDuration: 31,
        }),
        text: getConsolidatedApprovalEmailPlainText({
          adminName: lead.adminName,
          orgName: organization.name,
          organizationCode: organization.organizationCode,
          honorCode: organization.honorCode,
          plan,
          studentLimit: limits.max_students,
          activationLink,
          activationCode: credentials.activationCode,
          activationDate,
          expiryDate,
          planDuration: 31,
        }),
        type: "demo_provisioning_onboarding",
        channel: "notification",
        userId: admin._id,
        organizationId: organization._id,
      });
    } catch (emailError) {
      warnings.push("Provisioning completed, but the onboarding email could not be queued.");
      lead.lastConversionError = emailError.message || "Provisioning email queue failed.";
    }

    await lead.save();
    await trackOnboardingEvent({
      organizationId: organization._id,
      demoRequestId: lead._id,
      userId: actorUserId || admin._id,
      eventType: "lead_provisioned",
      stage: "provisioned",
      actorRole: "super_admin",
      metadata: {
        adminEmail: admin.email,
        plan,
        warnings,
      },
    });

    return {
      demoRequestId: lead._id,
      organization,
      admin,
      subscription: provisioned.subscription,
      warnings,
      activation: {
        activationLink,
        activationCode: credentials.activationCode,
        expiresAt: credentials.expiresAt,
      },
    };
  } catch (error) {
    await DemoRequest.findByIdAndUpdate(demoRequestId, {
      $set: {
        conversionStatus: "failed",
        lastConversionError: error.message || "Unknown provisioning error",
      },
    });
    throw error;
  }
}
