import mongoose from "mongoose";

const organizationResourceUsageSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        provider: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        providerLabel: {
            type: String,
            required: true,
            trim: true,
        },
        resourceType: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        metricKey: {
            type: String,
            required: true,
            trim: true,
        },
        metricLabel: {
            type: String,
            required: true,
            trim: true,
        },
        usageAmount: {
            type: Number,
            default: null,
        },
        unit: {
            type: String,
            default: "count",
            trim: true,
        },
        costAmount: {
            type: Number,
            default: null,
        },
        currency: {
            type: String,
            default: "INR",
            trim: true,
            uppercase: true,
        },
        quality: {
            type: String,
            enum: ["actual", "partial", "estimated", "manual", "unavailable"],
            default: "actual",
        },
        source: {
            type: String,
            required: true,
            trim: true,
        },
        periodStart: {
            type: Date,
            default: null,
            index: true,
        },
        periodEnd: {
            type: Date,
            default: null,
        },
        lastSyncedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

organizationResourceUsageSchema.index({ orgId: 1, provider: 1, metricKey: 1, periodStart: 1 });

export default mongoose.models.OrganizationResourceUsage ||
    mongoose.model("OrganizationResourceUsage", organizationResourceUsageSchema);