import express from "express";
import connectDB from "../../config/db.js";
import { processDemoExpiryReminders } from "../services/demo-expiry-reminder.service.js";

const router = express.Router();

/**
 * GET /api/cron/plan-expiry-check
 *
 * Checks real demo subscriptions from OrgSubscription and queues milestone emails for:
 * - 7 days left  -> review reminder
 * - 3 days left  -> demo ending soon
 * - 1 day left   -> final reminder
 * - expired      -> payment required / continue with paid access
 *
 * Secured by a CRON_SECRET header to prevent unauthorized access.
 */
router.get("/plan-expiry-check", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers["authorization"];

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await connectDB();
        const results = await processDemoExpiryReminders(new Date());

        return res.json({
            message: `Demo reminder check complete. ${results.queued} reminder(s) queued.`,
            ...results,
            errors: results.errors.length ? results.errors : undefined,
        });
    } catch (err) {
        console.error("[Cron] Plan expiry check error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/process-email-queue
 *
 * Processes pending email jobs from the MongoDB queue.
 * Runs every minute via Vercel cron.
 *
 * Safeguards:
 *  - Max 10 emails per run (Vercel 10s limit)
 *  - 8-second execution time guard
 *  - Atomic job locking (prevents duplicate sends)
 *  - Exponential backoff retry on failure
 */
router.get("/process-email-queue", async (req, res) => {
    const cronStart = Date.now();
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await connectDB();

        const { processEmailQueue } = await import("../services/email-queue.service.js");

        console.log("[Cron] Email queue processing triggered");
        const stats = await processEmailQueue(10);

        const totalDuration = Date.now() - cronStart;
        console.log(
            `[Cron] Email queue run complete: fetched=${stats.fetched} sent=${stats.sent} failed=${stats.failed} duration=${totalDuration}ms`
        );

        res.json({
            message: "Email queue processed",
            ...stats,
            cronDurationMs: totalDuration,
        });
    } catch (err) {
        const totalDuration = Date.now() - cronStart;
        console.error("[Cron] Email queue error:", err.message, `duration=${totalDuration}ms`);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/auto-close-tickets
 *
 * Automatically closes SupportTickets that have been "resolved" for more than 7 days.
 * Can be triggered by cron-job.org or Vercel cron.
 */
router.get("/auto-close-tickets", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await connectDB();
        
        const SupportTicket = (await import("../models/SupportTicket.js")).default;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await SupportTicket.updateMany(
            {
                status: "resolved",
                resolvedAt: { $lt: sevenDaysAgo }
            },
            {
                $set: { status: "closed" },
                $push: {
                    events: {
                        type: 'statusChanged',
                        label: 'Ticket auto-closed after 7 days of inactivity',
                        from: 'resolved',
                        to: 'closed',
                        actorName: 'System',
                        actorRole: 'system',
                        createdAt: new Date()
                    }
                }
            }
        );

        res.json({
            message: "Ticket auto-close complete",
            closedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("[Cron] Ticket auto-close error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/process-scheduled-messages
 *
 * Processes pending scheduled messages from Supabase chat_scheduled_messages.
 * Can be triggered by cron-job.org or Vercel cron.
 */
router.get("/process-scheduled-messages", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret || req.query.token;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { primarySupabaseClient } = await import("../config/supabaseClient.js");
        const sb = primarySupabaseClient;
        const { broadcastToChannel } = await import("../services/realtimeBroadcast.js");

        // Fetch pending messages that are due
        const now = new Date().toISOString();
        const { data: pendingMessages, error: fetchErr } = await sb
            .from('chat_scheduled_messages')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_for', now);

        if (fetchErr) {
            console.error("[Cron] Error fetching scheduled messages:", fetchErr);
            return res.status(500).json({ error: "Failed to fetch scheduled messages" });
        }

        if (!pendingMessages || pendingMessages.length === 0) {
            return res.json({ message: "No scheduled messages to process", processedCount: 0 });
        }

        let processedCount = 0;
        let failedCount = 0;

        for (const msg of pendingMessages) {
            try {
                // 1. Insert into chat_messages
                const { data: insertedMsg, error: insertErr } = await sb.from('chat_messages').insert({
                    thread_id: msg.thread_id,
                    sender_id: msg.sender_id,
                    sender_name: msg.sender_name,
                    user_avatar: null, // Could fetch if needed
                    message: msg.message || '',
                    reply_to: msg.reply_to,
                    created_at: new Date().toISOString(),
                    status: 'approved',
                }).select('id').single();

                if (insertErr) throw insertErr;
                const msgId = insertedMsg.id;

                // 2. Process attachments if any
                const attachments = [];
                if (msg.attachments && msg.attachments.length > 0) {
                    const attRecords = msg.attachments.map(att => ({
                        message_id: msgId,
                        file_url: att.file_url,
                        file_name: att.file_name,
                        file_type: att.file_type,
                        file_size: att.file_size
                    }));
                    const { data: insertedAtts, error: attErr } = await sb
                        .from('chat_attachments')
                        .insert(attRecords)
                        .select();
                    if (!attErr && insertedAtts) attachments.push(...insertedAtts);
                }

                // 3. Update thread last message
                let lastMsgText = msg.message || '';
                if (!lastMsgText && attachments.length > 0) {
                    lastMsgText = `[FILE] ${attachments.length} files`;
                }

                await sb.from('chat_threads')
                    .update({ last_message: lastMsgText, last_message_at: new Date().toISOString() })
                    .eq('id', msg.thread_id);

                // 4. Update scheduled message status to 'sent'
                await sb.from('chat_scheduled_messages')
                    .update({ status: 'sent', sent_at: new Date().toISOString() })
                    .eq('id', msg.id);

                // 5. Broadcast
                const broadcastPayload = {
                    id: msgId,
                    thread_id: msg.thread_id,
                    sender_id: msg.sender_id,
                    sender_name: msg.sender_name,
                    user_avatar: null,
                    message: msg.message || '',
                    reply_to: msg.reply_to,
                    is_deleted: false,
                    created_at: new Date().toISOString(),
                    attachments: attachments,
                };
                
                broadcastToChannel(`thread:${msg.thread_id}`, 'new_message', broadcastPayload);
                
                // Alert ALL thread members via their global user channel so their sidebars update
                sb.from('chat_thread_members').select('user_id').eq('thread_id', msg.thread_id).then(({ data: members }) => {
                   if (members) {
                       members.forEach(m => {
                           if (m.user_id !== msg.sender_id) {
                               broadcastToChannel(`user:${m.user_id}`, 'thread_updated', {
                                  threadId: msg.thread_id,
                                  messageId: msgId,
                                  message: broadcastPayload
                               });
                           }
                       });
                   }
                });

                processedCount++;
            } catch (innerErr) {
                console.error(`[Cron] Failed to process scheduled message ${msg.id}:`, innerErr);
                // Mark as failed
                await sb.from('chat_scheduled_messages').update({ status: 'failed' }).eq('id', msg.id);
                failedCount++;
            }
        }

        res.json({
            message: "Scheduled messages processed",
            processedCount,
            failedCount
        });
    } catch (err) {
        console.error("[Cron] Process scheduled messages error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/sync-group-members
 *
 * Synchronizes ERP roles (from MongoDB) with Supabase Chat Group memberships.
 * Handles adding missing users, removing users who lost the role, and promoting/demoting admins.
 */
router.get("/sync-group-members", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret || req.query.token;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await connectDB();
        const { primarySupabaseClient } = await import("../config/supabaseClient.js");
        const sb = primarySupabaseClient;
        const User = (await import("../models/User.js")).default;

        // 1. Fetch all groups that have either auto_add_roles or admin_roles
        const { data: groups, error: groupsErr } = await sb
            .from('chat_groups')
            .select('id, org_id, auto_add_roles, admin_roles');
            
        if (groupsErr) throw groupsErr;
        
        const autoGroups = groups.filter(g => 
            (g.auto_add_roles && g.auto_add_roles.length > 0) || 
            (g.admin_roles && g.admin_roles.length > 0)
        );

        let totalAdded = 0;
        let totalRemoved = 0;
        let totalPromoted = 0;
        let totalDemoted = 0;

        for (const group of autoGroups) {
            if (!group.org_id) continue;

            const memberRoles = group.auto_add_roles || [];
            const adminRoles = group.admin_roles || [];
            const allAllowedRoles = [...new Set([...memberRoles, ...adminRoles])];

            if (allAllowedRoles.length === 0) continue;

            // Fetch thread for group
            const { data: thread } = await sb.from('chat_threads').select('id').eq('group_id', group.id).single();
            if (!thread) continue;

            // 2. Query MongoDB for all matching users in this org
            const users = await User.find({
                organization_id: group.org_id,
                role: { $in: allAllowedRoles },
                status: 'active'
            }).select('_id role').lean();

            const expectedUsersMap = new Map();
            users.forEach(u => {
                expectedUsersMap.set(u._id.toString(), adminRoles.includes(u.role) ? 'admin' : 'member');
            });

            // 3. Query Supabase for current members of this thread
            const { data: currentMembers } = await sb
                .from('chat_thread_members')
                .select('id, user_id, role')
                .eq('thread_id', thread.id);
                
            const currentMembersMap = new Map();
            (currentMembers || []).forEach(m => {
                currentMembersMap.set(m.user_id, { id: m.id, role: m.role });
            });

            const toAdd = [];
            const toRemove = [];
            const toPromote = []; // member -> admin
            const toDemote = [];  // admin -> member

            // Check who needs to be added or updated
            for (const [userId, expectedRole] of expectedUsersMap.entries()) {
                const current = currentMembersMap.get(userId);
                if (!current) {
                    toAdd.push({ thread_id: thread.id, user_id: userId, role: expectedRole });
                } else if (current.role !== expectedRole) {
                    if (expectedRole === 'admin') toPromote.push(userId);
                    else toDemote.push(userId);
                }
            }

            // Check who needs to be removed
            // Strict enforcement: if you are in the group but not in expectedUsersMap, you get kicked.
            for (const [userId, current] of currentMembersMap.entries()) {
                if (!expectedUsersMap.has(userId)) {
                    toRemove.push(userId);
                }
            }

            // Execute changes
            if (toAdd.length > 0) {
                await sb.from('chat_thread_members').insert(toAdd);
                totalAdded += toAdd.length;
            }
            if (toRemove.length > 0) {
                await sb.from('chat_thread_members').delete().eq('thread_id', thread.id).in('user_id', toRemove);
                totalRemoved += toRemove.length;
            }
            if (toPromote.length > 0) {
                await sb.from('chat_thread_members').update({ role: 'admin' }).eq('thread_id', thread.id).in('user_id', toPromote);
                totalPromoted += toPromote.length;
            }
            if (toDemote.length > 0) {
                await sb.from('chat_thread_members').update({ role: 'member' }).eq('thread_id', thread.id).in('user_id', toDemote);
                totalDemoted += toDemote.length;
            }
        }

        res.json({
            message: "Group members synced successfully",
            stats: {
                totalGroupsProcessed: autoGroups.length,
                totalAdded,
                totalRemoved,
                totalPromoted,
                totalDemoted
            }
        });
    } catch (err) {
        console.error("[Cron] Sync group members error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /api/cron/delete-expired-messages
 *
 * Deletes messages where expires_at is in the past.
 * Runs every minute or hour via Vercel cron/cron-job.org.
 */
router.get("/delete-expired-messages", async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const querySecret = req.query.secret;
        const authHeader = req.headers["authorization"];

        if (cronSecret && querySecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { primarySupabaseClient } = await import("../config/supabaseClient.js");
        const sb = primarySupabaseClient;

        const now = new Date().toISOString();
        
        // Find messages to delete
        const { data: expiredMessages, error: fetchErr } = await sb
            .from('chat_messages')
            .select('id, thread_id')
            .lt('expires_at', now)
            .eq('is_deleted', false);
            
        if (fetchErr) throw fetchErr;
        
        if (!expiredMessages || expiredMessages.length === 0) {
            return res.json({ message: "No expired messages to delete", count: 0 });
        }
        
        const messageIds = expiredMessages.map(m => m.id);
        
        // Hard delete them
        const { error: deleteErr } = await sb
            .from('chat_messages')
            .delete()
            .in('id', messageIds);
            
        if (deleteErr) throw deleteErr;
        
        // Broadcast deletions (fire and forget)
        const { broadcastToChannel } = await import("../services/realtimeBroadcast.js");
        for (const msg of expiredMessages) {
            broadcastToChannel(`thread:${msg.thread_id}`, 'message_deleted', { messageId: msg.id });
        }

        res.json({
            message: "Expired messages deleted",
            count: expiredMessages.length,
            messageIds
        });
    } catch (err) {
        console.error("[Cron] Delete expired messages error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
