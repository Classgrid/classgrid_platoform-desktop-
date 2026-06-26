/**
 * Socket.io Client Provider
 * 
 * Connects to the backend Socket.io server for:
 * - Classroom chat (legacy)
 * - Typing indicators
 * - Video/voice call signaling
 * - Canteen KDS
 * - Admission broadcasts
 * 
 * The org-wide DM/group chat uses Supabase Realtime (see useRealtimeChat.ts).
 * This Socket.io connection handles everything else.
 */
import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://api.classgrid.in";

let socket: Socket | null = null;

/**
 * Initialize Socket.io connection with JWT auth.
 * Call this after user login with a valid JWT token.
 */
export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket.io connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("🔴 Socket.io connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("🔌 Socket.io disconnected:", reason);
  });

  return socket;
}

/**
 * Get the current socket instance.
 * Returns null if not connected.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect the socket (call on logout).
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Emit a typing indicator.
 */
export function emitTyping(classroomId: string | null, targetId: string | null, isTyping: boolean, userName: string) {
  socket?.emit("typing", { classroomId, targetId, isTyping, userName });
}

/**
 * Join a classroom chat room.
 */
export function joinClassroom(classroomId: string) {
  socket?.emit("join_classroom", classroomId);
}

/**
 * Leave a classroom chat room.
 */
export function leaveClassroom(classroomId: string) {
  socket?.emit("leave_classroom", classroomId);
}

/**
 * Join org support room.
 */
export function joinOrgSupport() {
  socket?.emit("join_org_support");
}

/**
 * Join a specific support thread room.
 */
export function joinSupportThread(threadId: string) {
  socket?.emit("join_support_thread", threadId);
}

/**
 * Join superadmin support room.
 */
export function joinSuperadminSupport() {
  socket?.emit("join_superadmin_support");
}

/**
 * Initiate a video/voice call.
 */
export function initiateCall(targetId: string, channelName: string, type: "video" | "voice", callerName: string) {
  socket?.emit("initiate_call", { targetId, channelName, type, callerName });
}

/**
 * Answer a call.
 */
export function answerCall(targetId: string, accepted: boolean) {
  socket?.emit("answer_call", { targetId, accepted });
}

/**
 * End a call.
 */
export function endCall(targetId: string) {
  socket?.emit("end_call", { targetId });
}

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  emitTyping,
  joinClassroom,
  leaveClassroom,
  joinOrgSupport,
  joinSupportThread,
  joinSuperadminSupport,
  initiateCall,
  answerCall,
  endCall,
};
