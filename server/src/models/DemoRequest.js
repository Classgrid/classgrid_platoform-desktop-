import mongoose from "mongoose";

const demoRequestSchema = new mongoose.Schema(
  {
    institutionName: { type: String, required: true, trim: true },
    orgType: { type: String, required: true, trim: true },
    adminName: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, trim: true, lowercase: true },
    adminPhone: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, default: "", trim: true },
    taluka: { type: String, default: "", trim: true },
    cityVillage: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    role: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    message: { type: String, default: "" },
    
    // Marketing Site Scheduled Info
    meetingUrl: { type: String, default: "", trim: true },
    provider: { type: String, default: "", trim: true },
    scheduledAt: { type: Date, default: null },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },
    
    // Verification
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, default: "" },
    otpExpiresAt: { type: Date, default: null },

    // Core Backend Status
    status: {
      type: String,
      enum: ["new", "contacted", "demo_scheduled", "pending", "closed", "converted"],
      default: "new",
    },
    
    // Assignment (Sales/Team Claiming)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date, default: null },
    
    // Legacy / Internal fields
    meetingStatus: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending",
    },
    meetingProvider: { type: String, default: "", trim: true },
    meetingScheduledAt: { type: Date, default: null },
    meetingTimezone: { type: String, default: "Asia/Kolkata", trim: true },
    meetingId: { type: String, default: "", trim: true },
    meetingNotes: { type: String, default: "" },
    meetingScheduledByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    meetingScheduledBySource: { type: String, default: "", trim: true },
    lifecycleStage: {
      type: String,
      enum: [
        "lead_created",
        "meeting_scheduled",
        "approved",
        "provisioned",
        "activated",
        "setup",
        "live",
      ],
      default: "lead_created",
    },
    conversionStatus: {
      type: String,
      enum: ["not_started", "in_progress", "provisioned", "failed"],
      default: "not_started",
    },
    conversionStartedAt: { type: Date, default: null },
    conversionCompletedAt: { type: Date, default: null },
    conversionAttemptCount: { type: Number, default: 0 },
    convertedAt: { type: Date, default: null },
    convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    provisionedOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    provisionedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lastConversionError: { type: String, default: "" },
  },
  { timestamps: true }
);

demoRequestSchema.index({ status: 1, createdAt: -1 });
demoRequestSchema.index({ conversionStatus: 1, createdAt: -1 });
demoRequestSchema.index({ adminEmail: 1, createdAt: -1 });
demoRequestSchema.index({ meetingStatus: 1, meetingScheduledAt: 1 });

export default mongoose.models.DemoRequest || mongoose.model("DemoRequest", demoRequestSchema);
