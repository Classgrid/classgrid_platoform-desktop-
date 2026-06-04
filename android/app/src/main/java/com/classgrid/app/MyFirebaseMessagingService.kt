package com.classgrid.app

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.media.RingtoneManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║            CLASSGRID PUSH NOTIFICATION SERVICE               ║
 * ║                                                              ║
 * ║  This service runs in the BACKGROUND even when the app is    ║
 * ║  force-closed. It listens for Firebase Cloud Messages sent   ║
 * ║  from our Node.js backend on AWS EC2.                        ║
 * ║                                                              ║
 * ║  Notification Types We Send:                                 ║
 * ║  • "Assignment Due Tomorrow" — deadline reminders            ║
 * ║  • "New Grade Posted" — exam results published               ║
 * ║  • "Live Class Starting" — Zoom/Meet link ready              ║
 * ║  • "New Message" — classroom chat notifications              ║
 * ║  • "Fee Payment Reminder" — upcoming due dates               ║
 * ║  • "Canteen Order Ready" — kitchen pickup alert              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "ClassgridFCM"
    }

    // ══════════════════════════════════════════════════════════
    //  TOKEN REFRESH — Send new token to our backend
    // ══════════════════════════════════════════════════════════
    //
    //  When the student installs Classgrid, Firebase generates
    //  a unique device token. We send this to our Node.js server
    //  so it knows WHERE to send push notifications.
    //
    //  Backend endpoint: POST /api/notifications/register-device
    //  Body: { "fcmToken": "abc123...", "platform": "android" }
    //
    // ══════════════════════════════════════════════════════════

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Token: $token")

        // TODO: When backend is ready, send this token to our server
        // Example:
        // val api = RetrofitClient.instance
        // api.registerDevice(DeviceRequest(fcmToken = token, platform = "android"))
        //
        // For now, we log it. The React app will also read the token
        // via the JavaScript Bridge and send it to the backend itself.
    }

    // ══════════════════════════════════════════════════════════
    //  MESSAGE RECEIVED — Show notification to the student
    // ══════════════════════════════════════════════════════════

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        Log.d(TAG, "Message received from: ${remoteMessage.from}")

        // Extract notification data from the FCM payload
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Classgrid"

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: "You have a new notification"

        // Deep link: Which React route to open when tapped
        // Example: "/classroom/physics-101/chat" or "/assignments"
        val deepLink = remoteMessage.data["deepLink"] ?: ""

        // Notification type for custom styling
        val type = remoteMessage.data["type"] ?: "general"

        showNotification(title, body, deepLink, type)
    }

    // ══════════════════════════════════════════════════════════
    //  BUILD & DISPLAY THE NOTIFICATION
    // ══════════════════════════════════════════════════════════

    private fun showNotification(
        title: String,
        body: String,
        deepLink: String,
        type: String
    ) {
        // When the student taps the notification, open the app
        // and navigate directly to the relevant React page
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            if (deepLink.isNotEmpty()) {
                data = android.net.Uri.parse("https://app.classgrid.in$deepLink")
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        // Choose notification icon color based on type
        val accentColor = when (type) {
            "assignment"    -> 0xFF4A90F5.toInt()  // Classgrid Blue
            "grade"         -> 0xFF22C55E.toInt()  // Success Green
            "live_class"    -> 0xFFEF4444.toInt()  // Urgent Red
            "chat"          -> 0xFF8B6FFF.toInt()  // Purple
            "fee"           -> 0xFFF59E0B.toInt()  // Amber/Gold
            "canteen"       -> 0xFFF97316.toInt()  // Orange
            "exam"          -> 0xFFEF4444.toInt()  // Urgent Red
            "announcement"  -> 0xFF6B7280.toInt()  // Gray (silent)
            else            -> 0xFF4A90F5.toInt()  // Default Blue
        }

        // Priority & vibration based on notification type
        val priority = when (type) {
            "live_class", "exam"  -> NotificationCompat.PRIORITY_MAX
            "assignment", "grade" -> NotificationCompat.PRIORITY_HIGH
            "announcement"        -> NotificationCompat.PRIORITY_LOW
            else                  -> NotificationCompat.PRIORITY_DEFAULT
        }

        val vibrationPattern = when (type) {
            "live_class", "exam"  -> longArrayOf(0, 300, 200, 300)  // Urgent double buzz
            "announcement"        -> longArrayOf(0)                  // Silent
            else                  -> longArrayOf(0, 200)             // Normal single buzz
        }

        val defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val builder = NotificationCompat.Builder(
            this,
            MainActivity.NOTIFICATION_CHANNEL_ID
        )
            .setSmallIcon(android.R.drawable.ic_dialog_info)  // TODO: Replace with Classgrid icon
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setColor(accentColor)
            .setContentIntent(pendingIntent)
            .setPriority(priority)
            .setVibrate(vibrationPattern)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))

        // Silent notifications don't play sound
        if (type != "announcement") {
            builder.setSound(defaultSound)
        }

        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}
