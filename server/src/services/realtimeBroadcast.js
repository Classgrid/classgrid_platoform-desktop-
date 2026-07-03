/**
 * Server-side Native Socket.IO Broadcaster
 * 
 * REPLACES Supabase Realtime. Uses the Socket.IO instance from socket.service.js
 * to broadcast events directly to connected clients via WebSocket.
 * 
 * The function signature is IDENTICAL to the old Supabase version so all
 * existing route files (thread_chat, group_chat, org_chat, etc.) work
 * without any code changes.
 * 
 * Channel naming convention (unchanged):
 *   - "thread:{threadId}"  → thread chat room
 *   - "user:{userId}"      → user's personal sidebar channel
 *   - "comments:{id}"      → comment threads
 *   - "classroom:{id}"     → classroom chat
 */

let _socketModule = null;

// Lazy import to avoid circular dependency
async function getIO() {
  if (!_socketModule) {
    try {
      _socketModule = await import("./socket.service.js");
    } catch (err) {
      console.error("[Realtime] Failed to import socket.service.js:", err.message);
      return null;
    }
  }
  return _socketModule.io;
}

/**
 * Broadcast an event to a Socket.IO room (replaces Supabase channel broadcast).
 * 
 * @param {string} channelName - e.g. "thread:abc123", "user:xyz"
 * @param {string} event - e.g. "new_message", "thread_updated", "reaction_update"
 * @param {object} payload - the data to send
 */
export async function broadcastToChannel(channelName, event, payload) {
  try {
    const io = await getIO();
    if (!io) {
      console.warn(`[Realtime] Cannot broadcast — Socket.IO not initialized`);
      return;
    }

    // Emit to the Socket.IO room with event name prefixed by channel type
    // e.g. room "thread:abc" gets event "thread:new_message"
    io.to(channelName).emit(`${channelName.split(':')[0]}:${event}`, payload);
  } catch (err) {
    console.error(`[Realtime] Broadcast error on ${channelName}:`, err.message);
  }
}

/**
 * Broadcast a notification to a specific user.
 */
export async function broadcastNotification(userId, notification) {
  await broadcastToChannel(`user:${userId}`, "notification", notification);
}

export default { broadcastToChannel, broadcastNotification };
