import mongoose from "mongoose";

const usageLineItemSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ["cloudflare_r2", "supabase_storage", "aws_ses", "firebase_sms", "mongodb", "redis", "vercel", "ec2", "openai", "groq", "agora"],
            required: true,
            index: true,
        },
        resourceKey: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        resourceLabel: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        unit: {
            type: String,
            enum: ["gb_day", "email", "sms", "request", "token", "student", "minute", "byte", "count"],
            required: true,
        },
        unitRateInr: {
            type: Number,
            default: 0,
            min: 0,
        },
        amountInr: {
            type: Number,
            default: 0,
            min: 0,
        },
        rawQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        rawUnit: {
            type: String,
            default: "",
            trim: true,
        },
        source: {
            type: String,
            required: true,
            trim: true,
        },
        sourceQuality: {
            type: String,
            enum: ["actual", "partial", "estimated", "unavailable"],
            default: "actual",
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { _id: false }
);

const organizationUsageDailySchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        orgSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrgSubscription",
            default: null,
        },
        day: {
            type: Date,
            required: true,
            index: true,
        },
        periodStart: {
            type: Date,
            required: true,
        },
        periodEnd: {
            type: Date,
            required: true,
        },
        timezone: {
            type: String,
            default: "Asia/Kolkata",
            trim: true,
        },
        currency: {
            type: String,
            default: "INR",
            uppercase: true,
            trim: true,
        },
        lineItems: {
            type: [usageLineItemSchema],
            default: [],
            validate: {
                validator(items) {
                    return items.length > 0;
                },
                message: "OrganizationUsageDaily requires at least one usage line item.",
            },
        },
        totals: {
            storageGbDays: { type: Number, default: 0, min: 0 },
            emails: { type: Number, default: 0, min: 0 },
            sms: { type: Number, default: 0, min: 0 },
            amountInr: { type: Number, default: 0, min: 0 },
        },
        rateSnapshot: {
            pricePerGB: { type: Number, default: 0, min: 0 },
            pricePerEmail: { type: Number, default: 0, min: 0 },
            pricePerSms: { type: Number, default: 0, min: 0 },
            pricePerStudent: { type: Number, default: 0, min: 0 },
        },
        calculationStatus: {
            type: String,
            enum: ["complete", "partial", "failed"],
            default: "complete",
            index: true,
        },
        calculationErrors: {
            type: [String],
            default: [],
        },
        calculationHash: {
            type: String,
            required: true,
            index: true,
        },
        calculatedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true }
);

organizationUsageDailySchema.index({ organizationId: 1, day: 1 }, { unique: true });
organizationUsageDailySchema.index({ day: -1, calculationStatus: 1 });

function immutableLedgerError() {
    return new Error("OrganizationUsageDaily is an immutable billing ledger. Insert correction records in a future ledger model instead of updating or deleting this record.");
}

organizationUsageDailySchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "replaceOne"], function blockUpdates(next) {
    next(immutableLedgerError());
});

organizationUsageDailySchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], function blockDeletes(next) {
    next(immutableLedgerError());
});

export default mongoose.models.OrganizationUsageDaily ||
    mongoose.model("OrganizationUsageDaily", organizationUsageDailySchema);
