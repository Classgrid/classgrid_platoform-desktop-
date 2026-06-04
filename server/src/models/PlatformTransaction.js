import mongoose from "mongoose";

/**
 * PlatformTransaction — records every payment event related to platform billing
 * (Org subscriptions paid via Razorpay or manually approved by Super Admin).
 * Separate from per-org FeeTransaction which tracks student fee payments.
 */
const platformTransactionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    organizationName: { type: String, default: "" }, // denormalized for fast reads

    // Who processed this (super_admin user or "system" for automated)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Payment source
    type: {
      type: String,
      enum: ["razorpay", "manual", "refund", "credit", "adjustment"],
      default: "razorpay",
    },

    // Amount in INR (paise for Razorpay, rupees for manual)
    amount: { type: Number, required: true }, // always stored in rupees
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["success", "failed", "refunded", "pending"],
      default: "success",
    },

    // Razorpay specific
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },

    // Plan that was activated by this payment
    planActivated: { type: String, enum: ["demo", "active"], default: "active" },

    // Refund details (if this is a refund transaction)
    refundOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformTransaction",
      default: null,
    },
    refundReason: { type: String, default: null },
    refundedAt: { type: Date, default: null },

    // Human-readable note (set by Super Admin)
    note: { type: String, default: "" },

    // New subscription expiry after this payment
    newExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

platformTransactionSchema.index({ organizationId: 1, createdAt: -1 });
platformTransactionSchema.index({ status: 1, createdAt: -1 });
platformTransactionSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

export default mongoose.models.PlatformTransaction ||
  mongoose.model("PlatformTransaction", platformTransactionSchema);
