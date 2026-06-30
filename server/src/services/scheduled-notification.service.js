import ScheduledNotification from "../models/ScheduledNotification.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { primarySupabaseClient as supabase } from "../config/supabaseClient.js";
import { sendPushToMultiple } from "./firebase.service.js";
import { sendPushNotification } from "./push.service.js";
import { sendNotificationEmail } from "./notification-email.service.js";
import {
    buildUserRoleFilter,
    getUserRolesForTarget,
    normalizeScheduledTarget,
} from "../utils/notification-targeting.js";

const DEFAULT_BATCH_SIZE = 10;
const FCM_BATCH_SIZE = 500;

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
}

function addOneYear(date) {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + 1);
    return next;
}

function scheduledTypeForCategory(category) {
    if (["maintenance", "update"].includes(category)) return "alert";
    return "system";
}

async function resolveScheduledRecipients(schedule) {
    const target = normalizeScheduledTarget(schedule.target);
    const baseFilter = { status: "active" };

    if (target === "global") {
        return User.find(baseFilter).select("_id").lean();
    }

    if (target === "active_orgs") {
        const orgs = await Organization.find({ status: "active" }).select("_id").lean();
        const orgIds = orgs.map((org) => org._id);
        if (orgIds.length === 0) return [];
        return User.find({ ...baseFilter, organization_id: { $in: orgIds } }).select("_id").lean();
    }

    if (target === "specific_org") {
        if (!schedule.targetOrgId) return [];
        return User.find({ ...baseFilter, organization_id: schedule.targetOrgId }).select("_id").lean();
    }

    const roles = getUserRolesForTarget(target);
    if (roles.length === 0) return [];
    return User.find({ ...baseFilter, ...buildUserRoleFilter(roles) }).select("_id").lean();
}

async function sendPushToRecipientIds(recipientIds, title, body, data) {
    if (recipientIds.length === 0) return { sent: 0, failed: 0, cleaned: 0 };

    let sent = 0;
    let failed = 0;
    let cleaned = 0;

    for (const recipientChunk of chunkArray(recipientIds, FCM_BATCH_SIZE)) {
        const { data: tokens, error } = await supabase
            .from("device_tokens")
            .select("fcm_token")
            .in("user_id", recipientChunk);

        if (error) {
            console.error("[ScheduledNotification] FCM token fetch failed:", error.message);
            failed += recipientChunk.length;
            continue;
        }

        const fcmTokens = (tokens || []).map((token) => token.fcm_token).filter(Boolean);
        if (fcmTokens.length > 0) {
            const result = await sendPushToMultiple(fcmTokens, title, body, data);
            sent += result.success;
            failed += result.failure;

            if (result.invalidTokens.length > 0) {
                await supabase.from("device_tokens").delete().in("fcm_token", result.invalidTokens);
                cleaned += result.invalidTokens.length;
            }
        }

        await Promise.allSettled(
            recipientChunk.map((recipientId) =>
                sendPushNotification(recipientId, { title, body, url: data.deepLink || data.link || "" })
            )
        );
    }

    return { sent, failed, cleaned };
}

async function sendEmailToRecipientIds(recipientIds, type, title, body, link) {
    if (recipientIds.length === 0) return 0;

    const results = await Promise.allSettled(
        recipientIds.map((recipientId) => sendNotificationEmail(recipientId, type, title, body, link))
    );

    return results.filter((result) => result.status === "fulfilled").length;
}

async function executeScheduledNotification(schedule) {
    const type = scheduledTypeForCategory(schedule.category);
    const recipients = await resolveScheduledRecipients(schedule);
    const recipientIds = recipients.map((recipient) => recipient._id.toString());
    const relatedId = schedule._id.toString();
    const link = schedule.deepLink || "";

    if (recipientIds.length > 0) {
        await Notification.insertMany(
            recipientIds.map((recipientId) => ({
                recipient: recipientId,
                type,
                title: schedule.title,
                message: schedule.body,
                link,
                relatedId,
            })),
            { ordered: false }
        );
    }

    const pushStats = await sendPushToRecipientIds(recipientIds, schedule.title, schedule.body, {
        deepLink: link,
        link,
        type,
        relatedId,
    });

    let emailsQueued = 0;
    if (schedule.sendEmail) {
        emailsQueued = await sendEmailToRecipientIds(recipientIds, type, schedule.title, schedule.body, link);
    }

    return {
        recipientCount: recipientIds.length,
        pushStats,
        emailsQueued,
    };
}

export async function processDueScheduledNotifications({ now = new Date(), batchSize = DEFAULT_BATCH_SIZE } = {}) {
    const due = await ScheduledNotification.find({
        status: "pending",
        scheduledAt: { $lte: now },
    })
        .sort({ scheduledAt: 1 })
        .limit(batchSize)
        .lean();

    const stats = { checked: due.length, sent: 0, failed: 0, skipped: 0 };

    for (const item of due) {
        const schedule = await ScheduledNotification.findOneAndUpdate(
            { _id: item._id, status: "pending" },
            { $set: { status: "processing" } },
            { new: true }
        );

        if (!schedule) {
            stats.skipped += 1;
            continue;
        }

        try {
            const result = await executeScheduledNotification(schedule);

            await ScheduledNotification.findByIdAndUpdate(schedule._id, {
                $set: {
                    status: "sent",
                    sentAt: new Date(),
                    sentCount: result.recipientCount,
                },
            });

            if (schedule.isRecurring) {
                await ScheduledNotification.create({
                    title: schedule.title,
                    body: schedule.body,
                    target: schedule.target,
                    targetOrgId: schedule.targetOrgId,
                    scheduledAt: addOneYear(schedule.scheduledAt),
                    isRecurring: true,
                    category: schedule.category,
                    deepLink: schedule.deepLink,
                    sendEmail: schedule.sendEmail,
                    createdBy: schedule.createdBy,
                });
            }

            stats.sent += 1;
        } catch (err) {
            await ScheduledNotification.findByIdAndUpdate(schedule._id, {
                $set: { status: "failed" },
            });
            stats.failed += 1;
            console.error("[ScheduledNotification] Delivery failed:", {
                id: schedule._id.toString(),
                error: err.message,
            });
        }
    }

    return stats;
}