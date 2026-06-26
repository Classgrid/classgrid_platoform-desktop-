import Notification from '../models/Notification.js';
import { sendPushToDevice, sendPushToMultiple } from './firebase.service.js';
import { primarySupabaseClient as supabase } from '../config/supabaseClient.js';
import { sendNotificationEmail } from './notification-email.service.js';
import { sendPushNotification } from './push.service.js';

/**
 * Central Notification Dispatcher
 * Handles internal DB notifications, Firebase Push, and Email alerts.
 */
export async function dispatchNotification({
    recipientId,
    type,
    title,
    message,
    link = '',
    relatedId = '',
    sendPush = true,
    sendEmail = false,
    orgId = null,
    isCall = false // --- Day 17: VoIP Ringing Support ---
}) {
    try {
        // 1. Throttling Check (Persistent in MongoDB or Redis - using simple DB check for now)
        if (sendPush && type === 'chat') {
            const lastNotif = await Notification.findOne({
                recipient: recipientId,
                type: 'chat',
                createdAt: { $gt: new Date(Date.now() - 30 * 1000) } // 30 second throttle
            }).lean();
            if (lastNotif) {
                // Skip push but still create DB record
                sendPush = false; 
            }
        }

        // 2. Create Internal DB Notification (Mongoose)
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            title,
            message,
            link,
            relatedId
        });

        // 2. Handle Firebase Push Notifications
        if (sendPush) {
            // Fetch FCM tokens from Supabase/Postgres
            const { data: tokens } = await supabase
                .from('device_tokens')
                .select('fcm_token')
                .eq('user_id', recipientId);

            if (tokens && tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.fcm_token);
                await sendPushToMultiple(fcmTokens, title, message, { link, type, relatedId, isCall });
            }

            // Web Push for Browsers
            await sendPushNotification(recipientId, { title, body: message, url: link }).catch(e => console.error("WebPush Dispatch Error:", e));
        }

        // 3. Handle Email Notifications (Optional)
        if (sendEmail) {
            // This assumes notification-email.service handles checking user prefs
            await sendNotificationEmail(recipientId, type, title, message, link);
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
        }

        return notification;
    } catch (err) {
        console.error('[NotificationService] Dispatch Error:', err.message);
        // We don't want notification failure to break the main application flow
        return null;
    }
}

/**
 * Bulk Dispatch to a list of students or faculty
 */
export async function bulkDispatchNotification({
    recipientIds,
    type,
    title,
    message,
    link = '',
    relatedId = '',
    sendPush = true
}) {
    try {
        const notifications = recipientIds.map(rid => ({
            recipient: rid,
            type,
            title,
            message,
            link,
            relatedId
        }));

        // Insert into MongoDB
        await Notification.insertMany(notifications);

        if (sendPush) {
            // Fetch all FCM tokens in one batch
            const { data: tokens } = await supabase
                .from('device_tokens')
                .select('fcm_token, user_id')
                .in('user_id', recipientIds);

            if (tokens && tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.fcm_token);
                await sendPushToMultiple(fcmTokens, title, message, { link, type, relatedId });
            }

            // Web Push for Browsers
            const webPushPromises = recipientIds.map(rid => 
                sendPushNotification(rid, { title, body: message, url: link }).catch(e => console.error("WebPush Bulk Dispatch Error:", e))
            );
            await Promise.allSettled(webPushPromises);
        }
    } catch (err) {
        console.error('[NotificationService] Bulk Dispatch Error:', err.message);
    }
}
