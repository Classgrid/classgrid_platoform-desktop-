import mongoose from "mongoose";

const paymentRequestSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrganizationPending",
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    planRequested: {
      type: String,
      enum: ["PAID"],
      default: "PAID",
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    screenshotUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentRequestSchema.index({ applicationId: 1, status: 1 });
paymentRequestSchema.index({ organizationId: 1, status: 1 });

export default mongoose.models.PaymentRequest ||
  mongoose.model("PaymentRequest", paymentRequestSchema);
