import SystemSettings from "../models/SystemSettings.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import EmailJob from "../models/EmailJob.js";
import Classroom from "../models/Classroom.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import CoursePlaylist from "../models/CoursePlaylist.js";
import CourseVideo from "../models/CourseVideo.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import ForumPost from "../models/ForumPost.js";
import ForumComment from "../models/ForumComment.js";
import OrganizationAnnouncement from "../models/OrganizationAnnouncement.js";
import SupportTicket from "../models/SupportTicket.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import ImportBatch from "../models/ImportBatch.js";
import PaymentRequest from "../models/PaymentRequest.js";
import PlatformTransaction from "../models/PlatformTransaction.js";
import FeeTransaction from "../models/FeeTransaction.js";
import Invoice from "../models/Invoice.js";
import StudentFeeLedger from "../models/StudentFeeLedger.js";
import NotePackage from "../models/NotePackage.js";
import PastPaper from "../models/PastPaper.js";
import Meeting from "../models/Meeting.js";
import OrgSubscription from "../models/OrgSubscription.js";
import OrganizationUsageDaily from "../models/OrganizationUsageDaily.js";
import SaasInvoice from "../models/SaasInvoice.js";
import { razorpay } from "../config/razorpay.js";
import crypto from "crypto";
import { studentNotesClient } from "../config/supabaseClient.js";
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";
import { getOrganizationResourceUsage, recordInternalResourceSnapshot } from "../services/organization-resource-meter.service.js";


async function getStatusCounts(Model, match, field = "status") {
    const rows = await Model.aggregate([
        { $match: match },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } }
    ]);

    return rows.reduce((accumulator, row) => {
        accumulator[row._id || "unknown"] = row.count;
        return accumulator;
    }, {});
}

async function getNumericTotals(Model, match, fields) {
    const group = fields.reduce((accumulator, field) => {
        accumulator[field] = { $sum: `$${field}` };
        return accumulator;
    }, {});

    const [result] = await Model.aggregate([
        { $match: match },
        { $group: { _id: null, ...group } }
    ]);

    return fields.reduce((accumulator, field) => {
        accumulator[field] = result?.[field] || 0;
        return accumulator;
    }, {});
}

// GET /api/admin/system-settings
export const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST /api/admin/system-settings
export const updateSystemSettings = async (req, res) => {
    try {
        const updates = req.body;
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings(updates);
        } else {
            Object.assign(settings, updates);
        }
        await settings.save();
        res.status(200).json({ message: "Settings updated", settings });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET /api/admin/usage/:orgId
export const getOrgUsage = async (req, res) => {
    try {
        const { orgId } = req.params;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [orgUsers, subscription] = await Promise.all([
            User.find({ organization_id: orgId }).select("_id").lean(),
            OrgSubscription.findOne({ organization_id: orgId }).lean(),
        ]);
        const userIds = orgUsers.map((user) => user._id);

        let totalStorageBytes = 0;
        let fileCount = 0;
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: files, error: storageError } = await studentNotesClient.storage
                .from("notes-files")
                .list(`student-notes/${orgId}`, { limit, offset });

            if (storageError) {
                console.error("Supabase Storage Error:", storageError);
                break;
            }

            if (!files || files.length === 0) {
                hasMore = false;
            } else {
                files.forEach((file) => {
                    if (file.metadata && file.metadata.size) {
                        totalStorageBytes += file.metadata.size;
                        fileCount++;
                    }
                });

                if (files.length < limit) {
                    hasMore = false;
                } else {
                    offset += limit;
                }
            }
        }

        const { count } = await studentNotesClient
            .from("student_notes")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", orgId);

        const emailFilter = userIds.length > 0
            ? {
                $or: [
                    { organizationId: orgId },
                    { userId: { $in: userIds } }
                ]
            }
            : { organizationId: orgId };

        const directEmailCount = await EmailJob.countDocuments({ organizationId: orgId });
        let totalEmails = directEmailCount;
        if (totalEmails === 0 && userIds.length > 0) {
            totalEmails = await EmailJob.countDocuments({ userId: { $in: userIds } });
        }

        const [
            emailDaily,
            emailMonthly,
            emailTypeBreakdownRaw,
            resourceCounts,
            supportStatus,
            paymentRequestStatus,
            platformTransactionStatus,
            feeTransactionStatus,
            invoiceStatus,
            highPrioritySupportTickets,
            feeCollectionTotals,
            studentLedgerTotals,
            invoiceTotals,
            platformBillingSuccessTotals,
            platformBillingRefundTotals,
            approvedPaymentRequestTotals,
            totalStudentLedgers,
            totalFeeTransactions,
            totalPlatformTransactions,
            totalPaymentRequests
        ] = await Promise.all([
            EmailJob.countDocuments({ ...emailFilter, createdAt: { $gte: startOfDay } }),
            EmailJob.countDocuments({ ...emailFilter, createdAt: { $gte: startOfMonth } }),
            EmailJob.aggregate([
                { $match: emailFilter },
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ]),
            Promise.all([
                Classroom.countDocuments({ organization_id: orgId }),
                Assignment.countDocuments({ organization_id: orgId }),
                AssignmentSubmission.countDocuments({ organization_id: orgId }),
                CoursePlaylist.countDocuments({ organization_id: orgId }),
                CourseVideo.countDocuments({ organization_id: orgId }),
                Exam.countDocuments({ organization_id: orgId }),
                ExamResult.countDocuments({ organization_id: orgId }),
                ForumPost.countDocuments({ organization_id: orgId }),
                ForumComment.countDocuments({ organization_id: orgId }),
                OrganizationAnnouncement.countDocuments({ organization_id: orgId }),
                SupportTicket.countDocuments({ organization_id: orgId }),
                AdmissionApplication.countDocuments({ organization_id: orgId }),
                ImportBatch.countDocuments({ organization_id: orgId }),
                NotePackage.countDocuments({ orgId: orgId }),
                PastPaper.countDocuments({ organization_id: orgId }),
                Meeting.countDocuments({ organization_id: orgId })
            ]),
            getStatusCounts(SupportTicket, { organization_id: orgId }),
            getStatusCounts(PaymentRequest, { organizationId: orgId }),
            getStatusCounts(PlatformTransaction, { organizationId: orgId }),
            getStatusCounts(FeeTransaction, { organizationId: orgId }),
            getStatusCounts(Invoice, { organization_id: orgId }),
            SupportTicket.countDocuments({
                organization_id: orgId,
                priority: { $in: ["high", "critical"] }
            }),
            getNumericTotals(FeeTransaction, {
                organizationId: orgId,
                status: { $in: ["success", "pending_verification"] }
            }, ["amount"]),
            getNumericTotals(StudentFeeLedger, { organizationId: orgId }, ["totalPayable", "totalPaid", "balance"]),
            getNumericTotals(Invoice, { organization_id: orgId }, ["total_amount", "amount_paid", "remaining_amount"]),
            getNumericTotals(PlatformTransaction, { organizationId: orgId, status: "success" }, ["amount"]),
            getNumericTotals(PlatformTransaction, { organizationId: orgId, status: "refunded" }, ["amount"]),
            getNumericTotals(PaymentRequest, { organizationId: orgId, status: "approved" }, ["amount"]),
            StudentFeeLedger.countDocuments({ organizationId: orgId }),
            FeeTransaction.countDocuments({ organizationId: orgId }),
            PlatformTransaction.countDocuments({ organizationId: orgId }),
            PaymentRequest.countDocuments({ organizationId: orgId })
        ]);

        const trackedCollections = {
            classrooms: resourceCounts[0],
            assignments: resourceCounts[1],
            assignmentSubmissions: resourceCounts[2],
            coursePlaylists: resourceCounts[3],
            courseVideos: resourceCounts[4],
            exams: resourceCounts[5],
            examResults: resourceCounts[6],
            forumPosts: resourceCounts[7],
            forumComments: resourceCounts[8],
            announcements: resourceCounts[9],
            supportTickets: resourceCounts[10],
            admissionApplications: resourceCounts[11],
            importBatches: resourceCounts[12],
            notePackages: resourceCounts[13],
            pastPapers: resourceCounts[14],
            meetings: resourceCounts[15]
        };

        const emailTypeBreakdown = emailTypeBreakdownRaw.reduce((accumulator, row) => {
            accumulator[row._id || "other"] = row.count;
            return accumulator;
        }, {});

        const totalTrackedRecords = (count || 0) + Object.values(trackedCollections).reduce(
            (sum, value) => sum + value,
            0
        );
        const invoiceCount = Object.values(invoiceStatus).reduce((sum, value) => sum + value, 0);
        const legacyStorageGb = totalStorageBytes / (1024 * 1024 * 1024);
        const includedStorageGb = subscription?.billing?.freeStorageGB
            ?? subscription?.metadata?.storage_limit_gb
            ?? 0;
        const configuredStorageRate = subscription?.billing?.pricePerGB;
        const billableStorageGb = Math.max(0, legacyStorageGb - includedStorageGb);
        const knownStorageChargeInr =
            typeof configuredStorageRate === "number"
                ? Number((billableStorageGb * configuredStorageRate).toFixed(2))
                : undefined;

        // Fetch Pay-As-You-Go Billing Ledger (Current Month)
        const dailyRecords = await OrganizationUsageDaily.find({
            organizationId: orgId,
            day: { $gte: startOfMonth }
        }).lean();

        let totalStorageGbDays = 0, totalEmailMeters = 0, totalSmsMeters = 0, totalApiMeters = 0, totalAiMeters = 0, totalAgoraMeters = 0, currentMonthAmount = 0;
        const lineItemAgg = new Map();

        dailyRecords.forEach(record => {
            totalStorageGbDays += (record.totals?.storageGbDays || 0);
            totalEmailMeters += (record.totals?.emails || 0);
            totalSmsMeters += (record.totals?.sms || 0);
            totalApiMeters += (record.totals?.apiRequests || 0);
            totalAiMeters += (record.totals?.aiTokens || 0);
            totalAgoraMeters += (record.totals?.agoraMinutes || 0);
            currentMonthAmount += (record.totals?.amountInr || 0);

            (record.lineItems || []).forEach(item => {
                const existing = lineItemAgg.get(item.resourceKey) || {
                    provider: item.provider,
                    resourceLabel: item.resourceLabel,
                    totalQuantity: 0,
                    unit: item.unit,
                    unitRateInr: item.unitRateInr,
                    amountInr: 0
                };
                existing.totalQuantity += item.quantity || 0;
                existing.amountInr += item.amountInr || 0;
                lineItemAgg.set(item.resourceKey, existing);
            });
        });

        // Fetch latest invoice
        const latestInvoice = await SaasInvoice.findOne({ organizationId: orgId }).sort({ createdAt: -1 }).lean();

        const usagePayload = {
            billingLedger: {
                currentMonth: {
                    totalStorageGbDays,
                    totalEmails: totalEmailMeters,
                    totalSmsSegments: totalSmsMeters,
                    totalApiRequests: totalApiMeters,
                    totalAiTokens: totalAiMeters,
                    totalAgoraMinutes: totalAgoraMeters,
                    totalAmountInr: Number(currentMonthAmount.toFixed(2)),
                    lineItems: [...lineItemAgg.values()].map(item => ({
                        ...item,
                        totalQuantity: Number(item.totalQuantity.toFixed(4)),
                        amountInr: Number(item.amountInr.toFixed(2))
                    }))
                },
                latestInvoice: latestInvoice ? {
                    invoiceNumber: latestInvoice.invoiceNumber,
                    totalAmountInr: latestInvoice.totalAmountInr,
                    status: latestInvoice.status,
                    dueDate: latestInvoice.dueDate,
                    month: latestInvoice.billingPeriod?.month,
                    year: latestInvoice.billingPeriod?.year
                } : null
            },
            storage: {
                bytes: totalStorageBytes,
                mb: (totalStorageBytes / (1024 * 1024)).toFixed(2),
                gb: Number(legacyStorageGb.toFixed(4)),
                fileCount,
                includedGb: includedStorageGb,
                billableGb: Number(billableStorageGb.toFixed(4)),
                configuredRateInr: configuredStorageRate,
                knownChargeInr: knownStorageChargeInr,
                coverage: "partial",
                scope: "Supabase notes-files under student-notes/{orgId}. This excludes Cloudflare R2, Vercel, EC2, MongoDB byte allocation, and shared infrastructure costs."
            },
            db: {
                notesCount: count || 0,
                trackedCollections,
                totalTrackedRecords
            },
            email: {
                totalSent: totalEmails,
                daily: emailDaily,
                monthly: emailMonthly,
                typeBreakdown: emailTypeBreakdown
            },
            support: {
                totalTickets: trackedCollections.supportTickets,
                byStatus: supportStatus,
                highPriorityTickets: highPrioritySupportTickets
            },
            finance: {
                invoices: {
                    total: invoiceCount,
                    byStatus: invoiceStatus,
                    totalBilledAmount: invoiceTotals.total_amount,
                    totalPaidAmount: invoiceTotals.amount_paid,
                    totalOutstandingAmount: invoiceTotals.remaining_amount
                },
                studentLedger: {
                    totalLedgers: totalStudentLedgers,
                    totalPayable: studentLedgerTotals.totalPayable,
                    totalPaid: studentLedgerTotals.totalPaid,
                    totalBalance: studentLedgerTotals.balance
                },
                feeCollections: {
                    totalTransactions: totalFeeTransactions,
                    byStatus: feeTransactionStatus,
                    successfulAmount: feeCollectionTotals.amount
                },
                platformBilling: {
                    totalTransactions: totalPlatformTransactions,
                    byStatus: platformTransactionStatus,
                    successfulAmount: platformBillingSuccessTotals.amount,
                    refundedAmount: platformBillingRefundTotals.amount
                },
                paymentRequests: {
                    total: totalPaymentRequests,
                    byStatus: paymentRequestStatus,
                    approvedAmount: approvedPaymentRequestTotals.amount
                }
            },
            coverage: {
                providerCostAllocation: "partial",
                reason: "The backend now stores internal per-organization resource meters and env-backed provider readiness. Vercel, EC2, Redis, MongoDB byte-cost, SMS, AI, Razorpay provider fees, and full R2 allocation still need provider/API syncs or tenant-tagged logs."
            }
        };

        try {
            usagePayload.resourceMeters = await recordInternalResourceSnapshot(orgId, usagePayload);
        } catch (meterError) {
            console.error("[AdminAnalytics] resource meter snapshot error:", meterError.message);
            usagePayload.resourceMeters = await getOrganizationResourceUsage(orgId);
            usagePayload.resourceMeters.captureError = meterError.message;
        }

        res.status(200).json(usagePayload);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET /api/admin/email-analytics (optional ?orgId=...)
export const getEmailAnalytics = async (req, res) => {
    try {
        const { orgId } = req.query;
        let filter = {};

        if (orgId) {
            const orgUsers = await User.find({ organization_id: orgId }).select('_id');
            const userIds = orgUsers.map(u => u._id);
            filter = {
                $or: [
                    { organizationId: orgId },
                    { userId: { $in: userIds } }
                ]
            };
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, daily, monthly] = await Promise.all([
            EmailJob.countDocuments(filter),
            EmailJob.countDocuments({ ...filter, createdAt: { $gte: startOfDay } }),
            EmailJob.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
        ]);

        // Breakdown by type (all-time)
        const breakdown = await EmailJob.aggregate([
            { $match: Object.keys(filter).length ? filter : {} },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        const typeBreakdown = {};
        breakdown.forEach(b => { typeBreakdown[b._id || 'other'] = b.count; });

        // Per-day chart for current month
        const dailyChartRaw = await EmailJob.aggregate([
            {
                $match: {
                    ...(Object.keys(filter).length ? filter : {}),
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in all days of the month with 0 for missing days
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const todayDay = now.getDate();
        const dailyChart = [];
        const rawMap = {};
        dailyChartRaw.forEach(d => { rawMap[d._id] = d.count; });

        for (let day = 1; day <= todayDay; day++) {
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dailyChart.push({ date: dateStr, count: rawMap[dateStr] || 0 });
        }

        res.status(200).json({ total, daily, monthly, typeBreakdown, dailyChart });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/admin/dashboard-analytics
export const getDashboardAnalytics = async (req, res) => {

    try {
        // 1. Notes tracking (from Supabase)
        const { data: allNotes, error } = await studentNotesClient
            .from('student_notes')
            .select('status, id');

        let notesStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
        if (!error && allNotes) {
            notesStats.total = allNotes.length;
            allNotes.forEach(n => {
                if (n.status === 'pending') notesStats.pending++;
                else if (n.status === 'approved') notesStats.approved++;
                else if (n.status === 'rejected') notesStats.rejected++;
            });
        }

        // 2. Student Growth metrics
        const users = await User.find({ role: 'student' }).select('createdAt organization_id').lean();

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOf7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let growth = {
            total: users.length,
            today: 0,
            last7Days: 0,
            thisMonth: 0
        };

        users.forEach(u => {
            const d = new Date(u.createdAt);
            if (d >= startOfDay) growth.today++;
            if (d >= startOf7Days) growth.last7Days++;
            if (d >= startOfMonth) growth.thisMonth++;
        });

        res.status(200).json({
            notes: notesStats,
            students: growth
        });
    } catch (err) {
        console.error('getDashboardAnalytics error:', err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET /api/admin/system-activity
export const getSystemActivity = async (req, res) => {
    try {
        const [recentLogins, recentOrgs, failedEmails, newUsers, suspendedUsers, newClassrooms] = await Promise.all([
            // 1. Recent logins
            User.find({ lastLoginAt: { $ne: null }, is_demo: { $ne: true } })
                .sort({ lastLoginAt: -1 }).limit(5)
                .select('name email role lastLoginAt').lean(),

            // 2. Recent org onboardings
            Organization.find()
                .sort({ createdAt: -1 }).limit(4)
                .select('name plan createdAt').lean(),

            // 3. Failed emails
            EmailJob.find({ status: 'failed' })
                .sort({ updatedAt: -1 }).limit(4)
                .select('to type error updatedAt').lean(),

            // 4. New student signups (last 7 days)
            User.find({
                role: 'student',
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }).sort({ createdAt: -1 }).limit(5)
                .select('name email createdAt').lean(),

            // 5. Recently suspended / blocked users
            User.find({ status: { $in: ['suspended', 'blocked'] } })
                .sort({ updatedAt: -1 }).limit(4)
                .select('name email status role updatedAt').lean(),

            // 6. New classrooms (last 7 days)
            Classroom.find({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }).sort({ createdAt: -1 }).limit(4)
                .select('name subject createdAt').lean(),
        ]);

        // 7. Recent note uploads from Supabase
        let formattedNotes = [];
        try {
            const { data: recentNotes } = await studentNotesClient
                .from('student_notes')
                .select('title, uploaded_by_name, created_at')
                .order('created_at', { ascending: false })
                .limit(4);
            if (recentNotes) {
                formattedNotes = recentNotes.map(n => ({
                    type: 'note_upload',
                    message: `"${n.title || 'Untitled'}" uploaded${n.uploaded_by_name ? ' by ' + n.uploaded_by_name : ''}`,
                    time: n.created_at
                }));
            }
        } catch (e) { /* non-critical */ }

        const formattedLogins = recentLogins.map(u => ({
            type: 'login',
            message: `${u.name || 'User'} (${(u.role || 'unknown').replace('_', ' ')}) logged in`,
            time: u.lastLoginAt,
            metadata: { email: u.email }
        }));

        const formattedOrgs = recentOrgs.map(o => ({
            type: 'org_approved',
            message: `Organization "${o.name || 'Unknown'}" was onboarded (${o.plan || 'FREE'})`,
            time: o.createdAt
        }));

        const formattedEmails = failedEmails.map(e => ({
            type: 'email_failed',
            message: `Failed ${e.type || 'unknown'} email to ${e.to || 'unknown'}`,
            time: e.updatedAt,
            error: e.error
        }));

        const formattedSignups = newUsers.map(u => ({
            type: 'signup',
            message: `New student joined: ${u.name || u.email || 'Unknown'}`,
            time: u.createdAt
        }));

        const formattedSuspended = suspendedUsers.map(u => ({
            type: u.status === 'blocked' ? 'user_blocked' : 'user_suspended',
            message: `${u.name || u.email} (${(u.role || 'student').replace('_', ' ')}) was ${u.status}`,
            time: u.updatedAt
        }));

        const formattedClassrooms = newClassrooms.map(c => ({
            type: 'classroom_created',
            message: `New classroom: "${c.name}"${c.subject ? ' � ' + c.subject : ''}`,
            time: c.createdAt
        }));

        let timeline = [
            ...formattedLogins,
            ...formattedOrgs,
            ...formattedEmails,
            ...formattedSignups,
            ...formattedSuspended,
            ...formattedClassrooms,
            ...formattedNotes
        ];
        timeline.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

        res.status(200).json(timeline.slice(0, 20));
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET /api/admin/global-storage
export const getGlobalStorageUsage = async (req, res) => {
    try {
        const orgs = await Organization.find().select('_id').lean();

        // 1. Supabase DB rows (notes count) across all orgs
        const { count, error: dbError } = await studentNotesClient
            .from('student_notes')
            .select('*', { count: 'exact', head: true });

        // 2. Estimate storage bytes
        // Doing storage.list() for every single organization is O(N) API calls and too slow for a dashboard.
        // We use an estimated average of 2.5MB per PDF note file.
        const assumedBytesPerFile = 2.5 * 1024 * 1024;
        const totalStorageBytes = (count || 0) * assumedBytesPerFile;

        const usagePayload = {
            storage: {
                bytes: totalStorageBytes,
                mb: (totalStorageBytes / (1024 * 1024)).toFixed(0),
                fileCount: count || 0,
                avgMbPerOrg: orgs.length > 0 ? ((totalStorageBytes / (1024 * 1024)) / orgs.length).toFixed(1) : 0
            }
        };
        res.status(200).json(usagePayload);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


