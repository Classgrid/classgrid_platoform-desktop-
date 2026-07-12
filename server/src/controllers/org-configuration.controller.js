import Organization from "../models/Organization.js";
import OrgSubscription from "../models/OrgSubscription.js";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import EmailJob from "../models/EmailJob.js";
import FirebaseSmsLog from "../models/FirebaseSmsLog.js";
import AiUsageLog from "../models/AiUsageLog.js";
import GoLive from "../models/GoLive.js";
import Meeting from "../models/Meeting.js";
import OrganizationUsageDaily from "../models/OrganizationUsageDaily.js";
import OrganizationResourceUsage from "../models/OrganizationResourceUsage.js";
import SaasInvoice from "../models/SaasInvoice.js";
import PlatformTransaction from "../models/PlatformTransaction.js";
import Invoice from "../models/Invoice.js";
import FeeTransaction from "../models/FeeTransaction.js";
import { getTerminology } from "../utils/terminology.js";

const FLAG_FIELDS = ["naac_module", "hr_module", "marketplace_module", "admission_module", "canteen_module", "exam_proctoring", "custom_domain_module", "fee_module", "ai_assistant", "analytics_module", "website_module", "certificates_module", "events_module", "feedback_module", "holiday_module", "id_cards_module", "dashboard_admission", "dashboard_fees", "dashboard_exam", "dashboard_library", "dashboard_attendance", "dashboard_hr", "dashboard_hostel"];
const BILLING_FIELDS = ["basePricePerMonth", "pricePerStudent", "pricePerFaculty", "pricePerDeptAdmin", "pricePerGB", "pricePerEmail", "pricePerSms", "pricePerApiRequest", "pricePerAiToken", "pricePerAgoraMinute"];
const LIMIT_FIELDS = ["max_students", "max_faculty", "max_dept_admins", "storage_limit_gb"];
const DEPT_ADMIN_ROLES = ["hod", "exam_controller", "fee_manager", "admission_head", "admission_verifier", "admission_counselor", "admission_clerk", "library_manager", "tpo_officer", "transport_manager", "counselor", "coordinator", "principal", "vice_principal"];

const asNumber = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const pick = (input, fields) => Object.fromEntries(fields.filter((field) => Object.hasOwn(input || {}, field)).map((field) => [field, input[field]]));
const countUsers = (users, roles) => users.filter((user) => roles.includes(user.role)).length;
const lineItemQuantity = (record, resourceKey) => asNumber(record.lineItems?.find((item) => item.resourceKey === resourceKey)?.quantity);
const publicInvoice = (invoice) => ({
    id: invoice._id, invoiceNumber: invoice.invoiceNumber, billingPeriod: invoice.billingPeriod,
    subtotal: asNumber(invoice.subtotalInr), taxPercent: asNumber(invoice.taxPercent),
    taxAmount: asNumber(invoice.taxAmountInr), total: asNumber(invoice.totalAmountInr),
    currency: invoice.currency, status: invoice.status, dueDate: invoice.dueDate,
    paidAt: invoice.razorpay?.paidAt || null, createdAt: invoice.createdAt,
});
const publicPayment = (payment) => ({
    id: payment._id, amount: asNumber(payment.amount), currency: payment.currency,
    status: payment.status, plan: payment.planActivated, note: payment.note,
    expiresAt: payment.newExpiresAt, createdAt: payment.createdAt,
});
const publicBillingRates = (rates = {}) => ({
    basePricePerMonth: asNumber(rates.basePricePerMonth),
    pricePerStudent: asNumber(rates.pricePerStudent),
    pricePerFaculty: asNumber(rates.pricePerFaculty),
    pricePerDeptAdmin: asNumber(rates.pricePerDeptAdmin),
    pricePerStorageGb: asNumber(rates.pricePerGB),
    pricePerEmail: asNumber(rates.pricePerEmail),
    pricePerSms: asNumber(rates.pricePerSms),
    pricePerAiUsageUnit: asNumber(rates.pricePerAiToken),
    pricePerLiveClassMinute: asNumber(rates.pricePerAgoraMinute),
});
function rangeFor(month, year) {
    const now = new Date();
    const safeMonth = Number(month) >= 1 && Number(month) <= 12 ? Number(month) : now.getUTCMonth() + 1;
    const safeYear = Number.isInteger(Number(year)) ? Number(year) : now.getUTCFullYear();
    return { month: safeMonth, year: safeYear, start: new Date(Date.UTC(safeYear, safeMonth - 1, 1)), end: new Date(Date.UTC(safeYear, safeMonth, 1)) };
}
function payload(organization, subscription) {
    const flags = organization.feature_flags || {};
    return {
        organization: { id: organization._id, name: organization.name, orgType: organization.org_type, status: organization.status, onboardingProgress: organization.onboarding_progress || {} },
        coreModules: { academics: true, onlineExams: true, examinationManagement: true, results: true, chat: true },
        configurableModules: {
            admissions: Boolean(flags.admission_module), fees: Boolean(flags.fee_module), hr: Boolean(flags.hr_module),
            canteen: Boolean(flags.canteen_module), aiAssistant: Boolean(flags.ai_assistant), analytics: Boolean(flags.analytics_module),
            website: Boolean(flags.website_module), certificates: Boolean(flags.certificates_module), holidays: Boolean(flags.holiday_module),
            idCards: Boolean(flags.id_cards_module), events: Boolean(flags.events_module), feedback: Boolean(flags.feedback_module),
            customDomain: Boolean(flags.custom_domain_module), marketplace: Boolean(flags.marketplace_module), accreditation: Boolean(flags.naac_module),
            examProctoring: Boolean(flags.exam_proctoring),
        },
        dashboards: {
            orgAdmin: true, faculty: true, student: true,
            admissions: Boolean(flags.dashboard_admission), fees: Boolean(flags.dashboard_fees), exams: Boolean(flags.dashboard_exam),
            library: Boolean(flags.dashboard_library), attendance: Boolean(flags.dashboard_attendance), hr: Boolean(flags.dashboard_hr),
            hostelAndTransport: Boolean(flags.dashboard_hostel),
        },
        featureFlags: flags,
        modulesAndDashboards: flags,
        subscription: subscription && { plan: subscription.plan, status: subscription.status, isPaid: subscription.isPaid, expiresAt: subscription.expiresAt, billing: publicBillingRates(subscription.billing), limits: subscription.metadata || {} },
    };
}
async function loadConfig(orgId) {
    const [organization, subscription] = await Promise.all([
        Organization.findById(orgId).select("name org_type status feature_flags onboarding_progress").lean(),
        OrgSubscription.findOne({ organization_id: orgId }).lean(),
    ]);
    return { organization, subscription };
}
export async function getOrganizationConfig(req, res) {
    try {
        const { organization, subscription } = await loadConfig(req.params.orgId);
        if (!organization) return res.status(404).json({ message: "Organization not found." });
        return res.json(payload(organization, subscription));
    } catch (error) { console.error("[OrgConfig] load failed:", error.message); return res.status(500).json({ message: "Unable to load organization configuration." }); }
}
export async function updateOrganizationConfig(req, res) {
    try {
        const flags = pick(req.body.featureFlags, FLAG_FIELDS);
        const billing = pick(req.body.billing, BILLING_FIELDS);
        const limits = pick(req.body.limits, LIMIT_FIELDS);
        if (Object.values(flags).some((value) => typeof value !== "boolean")) return res.status(400).json({ message: "Feature and dashboard values must be boolean." });
        if ([...Object.values(billing), ...Object.values(limits)].some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) return res.status(400).json({ message: "Billing rates and limits must be non-negative numbers." });
        const updates = Object.fromEntries(Object.entries(flags).map(([key, value]) => [`feature_flags.${key}`, value]));
        const organization = await Organization.findByIdAndUpdate(req.params.orgId, Object.keys(updates).length ? { $set: updates } : {}, { new: true, runValidators: true }).select("name org_type status feature_flags onboarding_progress").lean();
        if (!organization) return res.status(404).json({ message: "Organization not found." });
        let subscription = await OrgSubscription.findOne({ organization_id: req.params.orgId });
        if (!subscription) subscription = new OrgSubscription({ organization_id: req.params.orgId });
        Object.assign(subscription.billing, billing); Object.assign(subscription.metadata, limits); await subscription.save();
        return res.json(payload(organization, subscription.toObject()));
    } catch (error) { console.error("[OrgConfig] update failed:", error.message); return res.status(500).json({ message: "Unable to update organization configuration." }); }
}
export async function getMyOrganizationConfig(req, res) {
    if (!req.user?.organization_id) return res.status(400).json({ message: "No organization is associated with this account." });
    req.params.orgId = String(req.user.organization_id); return getOrganizationConfig(req, res);
}
async function meters(orgId, range) {
    const period = { $gte: range.start, $lt: range.end };
    const [emailsThisMonth, emailsTotal, smsMonth, smsTotal, aiMonth, classrooms, meetingMinutes, liveMinutes, storage] = await Promise.all([
        EmailJob.countDocuments({ organizationId: orgId, status: "sent", processedAt: period }), EmailJob.countDocuments({ organizationId: orgId, status: "sent" }),
        FirebaseSmsLog.aggregate([{ $match: { organizationId: orgId, status: { $in: ["sent", "delivered"] }, sentAt: period } }, { $group: { _id: null, count: { $sum: "$segmentCount" } } }]),
        FirebaseSmsLog.aggregate([{ $match: { organizationId: orgId, status: { $in: ["sent", "delivered"] } } }, { $group: { _id: null, count: { $sum: "$segmentCount" } } }]),
        AiUsageLog.aggregate([{ $match: { organization_id: orgId, success: true, createdAt: period } }, { $group: { _id: null, count: { $sum: "$totalTokens" } } }]),
        Classroom.countDocuments({ organization_id: orgId }),
        Meeting.aggregate([{ $match: { organization_id: orgId, start_time: period } }, { $group: { _id: null, minutes: { $sum: "$duration" } } }]),
        GoLive.aggregate([{ $match: { orgId: String(orgId), startTime: period } }, { $unwind: { path: "$participants", preserveNullAndEmptyArrays: true } }, { $group: { _id: null, minutes: { $sum: "$participants.watchTimeMinutes" } } }]),
        OrganizationResourceUsage.findOne({ orgId, resourceType: "storage", usageAmount: { $ne: null } }).sort({ lastSyncedAt: -1, updatedAt: -1 }).lean(),
    ]);
    const storageAmount = asNumber(storage?.usageAmount);
    const storageUsedGb = storage?.unit?.toLowerCase().includes("byte") ? storageAmount / (1024 ** 3) : storageAmount;
    return { emailsThisMonth, emailsTotal, smsThisMonth: asNumber(smsMonth[0]?.count), smsTotal: asNumber(smsTotal[0]?.count), aiThisMonth: asNumber(aiMonth[0]?.count), classrooms, liveMinutes: asNumber(meetingMinutes[0]?.minutes) + asNumber(liveMinutes[0]?.minutes), storageUsedGb };
}
function breakdown(users, field) {
    return Object.entries(users.reduce((result, user) => { const key = user[field] || "Unassigned"; result[key] = (result[key] || 0) + 1; return result; }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
export async function getOrganizationUsageSummary(req, res) {
    try {
        const orgId = req.user?.organization_id; if (!orgId) return res.status(400).json({ message: "No organization is associated with this account." });
        const range = rangeFor(req.query.month, req.query.year);
        const [organization, subscription, users, summaryMeters, ledger] = await Promise.all([
            Organization.findById(orgId).select("org_type structure_type").lean(), OrgSubscription.findOne({ organization_id: orgId }).lean(), User.find({ organization_id: orgId, status: "active" }).select("role department batch").lean(), meters(orgId, range), OrganizationUsageDaily.find({ organizationId: orgId, day: { $gte: range.start, $lt: range.end } }).sort({ day: 1 }).lean(),
        ]);
        const terminology = getTerminology(organization?.structure_type || organization?.org_type);
        const students = users.filter((user) => user.role === "student"); const faculty = users.filter((user) => ["teacher", "faculty"].includes(user.role)); const deptAdmins = users.filter((user) => DEPT_ADMIN_ROLES.includes(user.role));
        return res.json({ period: { month: range.month, year: range.year }, summary: {
            students: { active: students.length, limit: subscription?.metadata?.max_students ?? null }, faculty: { active: faculty.length, limit: subscription?.metadata?.max_faculty ?? null }, deptAdmins: { active: deptAdmins.length, limit: subscription?.metadata?.max_dept_admins ?? null }, orgAdmins: { active: countUsers(users, ["org_admin"]) }, classrooms: { active: summaryMeters.classrooms }, emailsSent: { thisMonth: summaryMeters.emailsThisMonth, total: summaryMeters.emailsTotal }, smsSent: { thisMonth: summaryMeters.smsThisMonth, total: summaryMeters.smsTotal }, storage: { usedGb: Number(summaryMeters.storageUsedGb.toFixed(4)), limitGb: subscription?.metadata?.storage_limit_gb ?? null }, liveClassMinutes: { thisMonth: summaryMeters.liveMinutes }, aiUsage: { thisMonth: summaryMeters.aiThisMonth },
        }, terminology, dailySeries: ledger.map((record) => ({ date: record.day.toISOString().slice(0, 10), emails: asNumber(record.totals?.emails), sms: asNumber(record.totals?.sms), activeStudents: students.length, liveMinutes: lineItemQuantity(record, "agora_minutes") })), studentBreakdown: { departmentLabel: terminology.course, yearLabel: terminology.year, byDepartment: breakdown(students, "department"), byYear: breakdown(students, "batch") }, facultyBreakdown: { departmentLabel: terminology.course, byDepartment: breakdown(faculty, "department") }, deptAdminBreakdown: Object.entries(deptAdmins.reduce((result, user) => { result[user.role] = (result[user.role] || 0) + 1; return result; }, {})).map(([role, count]) => ({ role, count })) });
    } catch (error) { console.error("[OrgUsage] load failed:", error.message); return res.status(500).json({ message: "Unable to load organization usage." }); }
}
export async function getOrganizationBilling(req, res) {
    try {
        const orgId = req.user?.organization_id; if (!orgId) return res.status(400).json({ message: "No organization is associated with this account." });
        const [subscription, users, usage, invoices, payments, feeSummary, feeTransactions] = await Promise.all([
            OrgSubscription.findOne({ organization_id: orgId }).lean(), User.find({ organization_id: orgId, status: "active" }).select("role").lean(), meters(orgId, rangeFor()), SaasInvoice.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(24).lean(), PlatformTransaction.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(100).lean(), Invoice.aggregate([{ $match: { organization_id: orgId } }, { $group: { _id: null, totalInvoices: { $sum: 1 }, totalBilled: { $sum: "$total_amount" }, totalPaid: { $sum: "$amount_paid" }, outstanding: { $sum: "$remaining_amount" } } }]), FeeTransaction.countDocuments({ organizationId: orgId, status: "success" }),
        ]);
        const rates = subscription?.billing || {}; const charge = (count, rate) => ({ count, rate: asNumber(rate), total: Number((count * asNumber(rate)).toFixed(2)) });
        const platformFee = asNumber(rates.basePricePerMonth), studentCharges = charge(countUsers(users, ["student"]), rates.pricePerStudent), facultyCharges = charge(countUsers(users, ["teacher", "faculty"]), rates.pricePerFaculty), deptAdminCharges = charge(countUsers(users, DEPT_ADMIN_ROLES), rates.pricePerDeptAdmin), emailCharges = charge(usage.emailsThisMonth, rates.pricePerEmail);
        const smsCharges = charge(usage.smsThisMonth, rates.pricePerSms), storageCharges = charge(usage.storageUsedGb, rates.pricePerGB), aiUsageCharges = charge(usage.aiThisMonth, rates.pricePerAiToken), liveClassCharges = charge(usage.liveMinutes, rates.pricePerAgoraMinute);
        const subtotal = Number((platformFee + studentCharges.total + facultyCharges.total + deptAdminCharges.total + emailCharges.total + smsCharges.total + storageCharges.total + aiUsageCharges.total + liveClassCharges.total).toFixed(2)), gstPercent = 18, gstAmount = Number((subtotal * gstPercent / 100).toFixed(2)); const fees = feeSummary[0] || {};
        return res.json({ subscription: subscription && { plan: subscription.plan, status: subscription.status, isPaid: subscription.isPaid, expiresAt: subscription.expiresAt, features: subscription.features, billing: publicBillingRates(rates), limits: { maxStudents: subscription.metadata?.max_students ?? null, maxFaculty: subscription.metadata?.max_faculty ?? null, maxDeptAdmins: subscription.metadata?.max_dept_admins ?? null, storageGb: subscription.metadata?.storage_limit_gb ?? null } }, currentMonthCharges: { platformFee, studentCharges, facultyCharges, deptAdminCharges, emailCharges, smsCharges, storageCharges, aiUsageCharges, liveClassCharges, subtotal, gstPercent, gstAmount, total: Number((subtotal + gstAmount).toFixed(2)) }, invoices: invoices.map(publicInvoice), payments: payments.map(publicPayment), feeCollection: { totalInvoices: asNumber(fees.totalInvoices), totalBilled: asNumber(fees.totalBilled), totalPaid: asNumber(fees.totalPaid), outstanding: asNumber(fees.outstanding), transactions: feeTransactions } });
    } catch (error) { console.error("[OrgBilling] load failed:", error.message); return res.status(500).json({ message: "Unable to load organization billing." }); }
}
