/**
 * Classgrid — SaasInvoice Model
 *
 * Monthly invoice generated for each organization based on their
 * actual resource usage (Pay-As-You-Go). The Org Admin pays this
 * via Razorpay from their dashboard.
 *
 * Flow:
 * 1. Nightly worker populates OrganizationUsageDaily
 * 2. On the 1st of each month, monthly-invoice.worker aggregates
 *    the previous month's daily records into one SaasInvoice
 * 3. Email is sent to the Org Admin with the invoice link
 * 4. Org Admin clicks "Pay Now" → Razorpay → webhook marks as paid
 */

import mongoose from "mongoose";

const invoiceLineItemSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            required: true,
        },
        resourceLabel: {
            type: String,
            required: true,
        },
        totalQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        unit: {
            type: String,
            required: true,
        },
        unitRateInr: {
            type: Number,
            required: true,
            min: 0,
        },
        amountInr: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const saasInvoiceSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        billingPeriod: {
            month: { type: Number, required: true, min: 1, max: 12 },
            year: { type: Number, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
        },
        lineItems: {
            type: [invoiceLineItemSchema],
            default: [],
        },
        subtotalInr: {
            type: Number,
            required: true,
            min: 0,
        },
        taxPercent: {
            type: Number,
            default: 18, // GST 18%
            min: 0,
        },
        taxAmountInr: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmountInr: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
            uppercase: true,
        },
        status: {
            type: String,
            enum: ["draft", "sent", "paid", "overdue", "cancelled"],
            default: "draft",
            index: true,
        },
        dueDate: {
            type: Date,
            required: true,
            index: true,
        },
        // Razorpay payment tracking
        razorpay: {
            orderId: { type: String, default: null },
            paymentId: { type: String, default: null },
            paymentMethod: { type: String, default: null },
            paidAt: { type: Date, default: null },
        },
        // Email tracking
        emailSentAt: { type: Date, default: null },
        reminderSentAt: { type: Date, default: null },
        // Notes
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

saasInvoiceSchema.index({ organizationId: 1, "billingPeriod.year": 1, "billingPeriod.month": 1 }, { unique: true });
saasInvoiceSchema.index({ status: 1, dueDate: 1 });

export default mongoose.models.SaasInvoice || mongoose.model("SaasInvoice", saasInvoiceSchema);
