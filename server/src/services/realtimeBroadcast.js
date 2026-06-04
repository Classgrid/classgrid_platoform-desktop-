/**
 * Server-side Supabase Realtime Broadcaster
 * 
 * Used by API routes to broadcast events to Supabase channels
 * so connected clients receive real-time updates.
 * 
 * Uses the Chat Supabase project (SUPABASE_CHAT_URL + SUPABASE_CHAT_KEY).
 */
import { getChatSb } from "../config/supabaseClient.js";

let supabase = null;
try {
  supabase = getChatSb();
} catch {
  console.warn("⚠️ SUPABASE_CHAT_URL or SUPABASE_CHAT_KEY not set. Realtime broadcasting disabled.");
}

const serverChannels = new Map();

/**
 * Broadcast an event to a Supabase Realtime channel.
 * 
 * @param {string} channelName - e.g. "thread:abc123"
 * @param {string} event - e.g. "new_message", "notification"
 * @param {object} payload - the data to send
 */
export async function broadcastToChannel(channelName, event, payload) {
  // Await the broadcast so Serverless functions don't freeze before it completes
  try {
    await _doBroadcast(channelName, event, payload);
  } catch (err) {
    console.error(`[Realtime] Background broadcast error:`, err.message);
  }
}

async function _doBroadcast(channelName, event, payload, retries = 0) {
  if (!supabase) {
    console.warn(`[Realtime] Cannot broadcast — Supabase not configured`);
    return;
  }

  try {
    let channel = serverChannels.get(channelName);
    
    // Create and subscribe if it doesn't exist
    if (!channel) {
      channel = supabase.channel(channelName);
      serverChannels.set(channelName, channel);
      
      // Cap the wait time at 150ms. If Vercel connects fast (<50ms), we are golden.
      // If Localhost hangs (>150ms), we bail out of the await instantly so the UI isn't blocked, 
      // but let the Promise resolve quietly in the background.
      const subscriptionPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Channel subscription timeout')), 2000);
        channel.subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(timeout);
            serverChannels.delete(channelName);
            reject(err || new Error(`Channel status: ${status}`));
          }
        });
      });

      // Wait at most 150ms before returning to let the REST API finish
      await Promise.race([
          subscriptionPromise,
          new Promise(r => setTimeout(r, 150))
      ]).catch(() => { /* Ignore timeouts */ });
    } else {
      // Re-subscribe if disconnected
      if (channel.state === 'closed' || channel.state === 'errored') {
          serverChannels.delete(channelName);
          if (retries < 1) {
            return _doBroadcast(channelName, event, payload, retries + 1);
          }
          console.warn(`[Realtime] Giving up on ${channelName} after ${retries} retries`);
          return;
      }
    }

    // Fire and forget the broadcast so it doesn't block the API response
    channel.send({
      type: "broadcast",
      event,
      payload,
    }).catch(err => {
      console.error(`[Realtime] Failed to broadcast on ${channelName}:`, err.message);
    });
    
  } catch (err) {
    console.error(`[Realtime] Exception during broadcast to ${channelName}:`, err.message);
  }
}

/**
 * Broadcast a notification to a specific user.
 */
export async function broadcastNotification(userId, notification) {
  await broadcastToChannel(`user:${userId}`, "notification", notification);
}

export default { broadcastToChannel, broadcastNotification };
