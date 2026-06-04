// ══════════════════════════════════════════════════════════════
//  FIREBASE ADMIN SDK SERVICE
//  Handles server-side push notification delivery via FCM
// ══════════════════════════════════════════════════════════════

import admin from "firebase-admin";

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK.
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON env var containing
 * the stringified service account JSON from Firebase Console.
 *
 * Get it from: Firebase Console → Project Settings → Service Accounts
 *              → "Generate new private key"
 */
function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled.");
      return null;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (err) {
    console.error("❌ Firebase Admin init failed:", err.message);
    return null;
  }
}

/**
 * Send a push notification to a single device.
 *
 * @param {string} fcmToken - The device's FCM registration token
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Optional data payload (deepLink, type, etc.)
 * @returns {Promise<string|null>} Message ID on success, null on failure
 */
export async function sendPushToDevice(fcmToken, title, body, data = {}) {
  const app = getFirebaseAdmin();
  if (!app) return null;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        ...data,
        title,     // Also include in data payload for background handling
        body,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "classgrid_notifications",
          sound: "default",
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`📨 Push sent: ${title} → ${fcmToken.slice(0, 20)}...`);
    return response;
  } catch (err) {
    // If token is invalid/expired, caller should remove it from DB
    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      console.warn(`⚠️  Invalid FCM token (should be removed): ${fcmToken.slice(0, 20)}...`);
      return "INVALID_TOKEN";
    }
    console.error("❌ Push send failed:", err.message);
    return null;
  }
}

/**
 * Send push notification to multiple devices at once.
 *
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Optional data payload
 * @returns {Promise<{success: number, failure: number, invalidTokens: string[]}>}
 */
export async function sendPushToMultiple(fcmTokens, title, body, data = {}) {
  const app = getFirebaseAdmin();
  if (!app || fcmTokens.length === 0) {
    return { success: 0, failure: 0, invalidTokens: [] };
  }

  try {
    const message = {
      notification: { title, body },
      data: {
        ...data,
        title,
        body,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: "high",
        notification: {
          // If it's a call, map to a dedicated calling channel with a loud repeating sound
          channelId: data.isCall ? "classgrid_calls" : "classgrid_notifications",
          sound: data.isCall ? "ringtone" : "default",
          defaultSound: !data.isCall,
          defaultVibrateTimings: !data.isCall
        },
      },
      apns: {
         payload: {
             aps: {
                 sound: data.isCall ? "ringtone.wav" : "default"
             }
         }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      ...message,
    });

    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error &&
        (resp.error.code === "messaging/invalid-registration-token" ||
          resp.error.code === "messaging/registration-token-not-registered")
      ) {
        invalidTokens.push(fcmTokens[idx]);
      }
    });

    console.log(`📨 Multicast: ${response.successCount} sent, ${response.failureCount} failed`);

    return {
      success: response.successCount,
      failure: response.failureCount,
      invalidTokens,
    };
  } catch (err) {
    console.error("❌ Multicast push failed:", err.message);
    return { success: 0, failure: fcmTokens.length, invalidTokens: [] };
  }
}

export default { sendPushToDevice, sendPushToMultiple, getFirebaseAdmin };
