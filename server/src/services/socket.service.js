import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import MeetingChat from "../models/MeetingChat.js";
import GoLive from "../models/GoLive.js";
import { dispatchNotification } from "./notification.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const isDev = process.env.NODE_ENV !== "production";

let pubClient, subClient, redisClient;

if (!isDev) {
    pubClient = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    subClient = pubClient.duplicate();
    redisClient = pubClient.duplicate();
}

export let io;

// Adaptive worker configuration
const MAX_REDIS_STREAM_SIZE = 800; // 80% of 1000 threshold for emergency flush
const STREAM_GROUP = "chat_workers";
const STREAM_CONSUMER = `worker_${process.pid}`;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "https://classgrid.in", 
            methods: ["GET", "POST"]
        }
    });

    // Hook up socket.io-redis adapter for PM2 multi-node scaling (production only)
    if (!isDev && pubClient && subClient) {
        io.adapter(createAdapter(pubClient, subClient));
    }

    // Middleware for Auth
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) return next(new Error("Authentication error: No token provided"));

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.id; // User ID
            socket.orgId = decoded.organizationId; // Tenant isolation
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        const orgId = socket.orgId;
        const orgStreamKey = `chat:stream:org_${orgId}`;

        console.log(`🔌 Socket connected: ${socket.userId} (Org: ${orgId})`);

        // Ensure consumer group exists (catch if it already exists)
        if (orgId && redisClient) {
            redisClient.xgroup("CREATE", orgStreamKey, STREAM_GROUP, "0", "MKSTREAM").catch(() => {});
        }

        // Join global organization room for org-wide broadcasts (e.g. new public groups)
        socket.join(`org:${orgId}`);

        // Join personal room for private direct messages
        socket.join(`${orgId}:${socket.userId}`);

        socket.on("join_classroom", (classroomId) => {
            const roomName = `${orgId}:${classroomId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined room ${roomName}`);
        });

        // ── Thread Chat (replaces Supabase Realtime) ──
        socket.on("join_thread", (threadId) => {
            if (!threadId) return;
            const roomName = `thread:${threadId}`;
            socket.join(roomName);
        });

        socket.on("leave_thread", (threadId) => {
            if (!threadId) return;
            const roomName = `thread:${threadId}`;
            socket.leave(roomName);
        });

        socket.on("join_user_channel", (userId) => {
            if (!userId) return;
            const roomName = `user:${userId}`;
            socket.join(roomName);
        });

        socket.on("thread_typing", ({ threadId, isTyping, activityType }) => {
            if (!threadId) return;
            socket.to(`thread:${threadId}`).emit("thread:typing", {
                userId: socket.userId,
                isTyping,
                activityType: activityType || "typing",
            });
        });

        socket.on("join_org_support", () => {
            const roomName = `org_support:${orgId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined org support room ${roomName}`);
        });

        socket.on("join_support_thread", (threadId) => {
            if (!threadId) return;
            const roomName = `support:${threadId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined support thread ${roomName}`);
        });

        socket.on("join_superadmin_support", () => {
            socket.join("superadmin:support");
            console.log(`Super admin socket ${socket.userId} joined superadmin:support`);
        });

        socket.on("leave_classroom", (classroomId) => {
            const roomName = `${orgId}:${classroomId}`;
            socket.leave(roomName);
        });

        // --- Day 17: Synced Meeting Chat ---
        socket.on("join_meeting", (meetingId) => {
            const roomName = `meeting:${meetingId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined meeting room ${roomName}`);
        });

        socket.on("send_meeting_message", async (data) => {
            try {
                const { meetingId, message } = data;
                const meeting = await GoLive.findById(meetingId);
                
                if (!meeting || meeting.status !== 'active') return;

                const relativeTimestamp = Math.floor((Date.now() - meeting.startTime) / 1000);

                const chatEntry = await MeetingChat.create({
                    orgId: socket.orgId,
                    meeting: meetingId,
                    user: socket.userId,
                    message,
                    timestamp: relativeTimestamp
                });

                // Emit to meeting room
                io.to(`meeting:${meetingId}`).emit("new_meeting_message", {
                    _id: chatEntry._id,
                    user: socket.userId,
                    message,
                    timestamp: relativeTimestamp,
                    createdAt: chatEntry.createdAt
                });
            } catch (err) {
                console.error("[Socket] send_meeting_message error:", err);
            }
        });

        socket.on("send_message", async (data, callback) => {
            try {
                const { classroom, receiver, content, messageType, fileUrl, fileName, fileType, fileSize } = data;
                
                const messageObj = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    classroom,
                    sender: socket.userId,
                    receiver: receiver || null,
                    content,
                    messageType: messageType || "group",
                    fileUrl: fileUrl || null,
                    fileName: fileName || null,
                    fileType: fileType || null,
                    fileSize: fileSize || null,
                    createdAt: new Date().toISOString()
                };

                // 1) Fast emit to clients in the room (optimistic delivery)
                if (messageType === "private" && receiver) {
                    // Send to sender and receiver
                    io.to(`${orgId}:${socket.userId}`).to(`${orgId}:${receiver}`).emit("new_message", messageObj);
                    
                    // 🔔 Push notification for private message
                    dispatchNotification({
                        recipientId: receiver,
                        type: "chat",
                        title: "💬 New Message",
                        message: `Msg from ${socket.userId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                        link: `/chat/private/${socket.userId}`,
                        sendPush: true,
                        sendEmail: false
                    }).catch(e => console.error("[Socket] Push error:", e));

                } else {
                    // Group chat
                    const roomName = `${orgId}:${classroom}`;
                    io.to(roomName).emit("new_message", messageObj);

                    // 🔔 Push notification for group message (Optional: could be filtered by mentions)
                    // For now, let's just log it or send to a specific subset if needed.
                    // Implementation note: Sending group push usually requires checking who is offline.
                }
                
                // Return immediate positive response to sender
                if (typeof callback === "function") callback({ success: true, message: messageObj });

                // 2) Push to Redis Stream
                const messageString = JSON.stringify(messageObj);
                await redisClient.xadd(orgStreamKey, "*", "payload", messageString);

                // 3) Check Emergency Flush
                const streamLength = await redisClient.xlen(orgStreamKey);
                if (streamLength >= MAX_REDIS_STREAM_SIZE) {
                    console.log(`[Socket] Emergency flush triggered for ${orgStreamKey}. Size: ${streamLength}`);
                    flushChatStream(orgId); 
                }
            } catch (error) {
                console.error("[Socket] send_message error:", error);
                if (typeof callback === "function") callback({ success: false, error: "Failed to process message" });
            }
        });

        // Typing indicators
        socket.on("typing", ({ classroomId, targetId, isTyping, userName }) => {
            if (targetId) {
                // Private chat typing
                socket.to(`${orgId}:${targetId}`).emit("typing", { userId: socket.userId, userName, isTyping, classroomId });
            } else if (classroomId) {
                // Group chat typing
                socket.to(`${orgId}:${classroomId}`).emit("typing", { userId: socket.userId, userName, isTyping, classroomId });
            }
        });

        // --- Day 17: Video Call Signaling ---
        socket.on("initiate_call", ({ targetId, channelName, type, callerName }) => {
            // 1. Instant Socket delivery (if they are online)
            io.to(`${orgId}:${targetId}`).emit("incoming_call", {
                from: socket.userId,
                callerName: callerName || "A user",
                channelName,
                type // 'video' or 'voice'
            });
            console.log(`[Call] ${socket.userId} calling ${targetId} on ${channelName}`);

            // 2. Guaranteed Push Notification (if they are offline/locked)
            const callType = type === 'video' ? '📹 Video Call' : '📞 Voice Call';
            dispatchNotification({
                recipientId: targetId,
                type: "alert",
                title: `${callType} Incoming`,
                message: `${callerName || "Someone"} is calling you. Tap to answer.`,
                link: `/chat/call/${channelName}`, 
                sendPush: true,
                sendEmail: false,
                isCall: true // Tells FCM to ring aloud!
            }).catch(e => console.error("[Socket Call] Push error:", e));
        });

        socket.on("answer_call", ({ targetId, accepted }) => {
            // Signal the caller about the answer
            io.to(`${orgId}:${targetId}`).emit("call_answered", {
                from: socket.userId,
                accepted
            });
        });

        socket.on("end_call", ({ targetId }) => {
            io.to(`${orgId}:${targetId}`).emit("call_ended", {
                from: socket.userId
            });
        });

        // --- Day 16: Admission Broadcasts ---
        socket.on("join_admission_broadcast", () => {
            const roomName = `org_${orgId}_admission`;
            socket.join(roomName);
            console.log(`📡 User ${socket.userId} joined ADMISSION broadcast room: ${roomName}`);
        });

        // --- Day 15: Canteen KDS Room ---
        socket.on("join_canteen_kitchen", () => {
            const roomName = `org_${orgId}_canteen_kitchen`;
            socket.join(roomName);
            console.log(`🍔 User ${socket.userId} joined CANTEEN KDS room: ${roomName}`);
        });

        socket.on("disconnect", () => {
             console.log(`🔌 Socket disconnected: ${socket.userId}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};

/**
 * Adaptive Worker: Pulls from Redis Stream, Bulk inserts to MongoDB, then ACKs.
 * This can be run explicitly (emergency flush) or tracked via a background interval worker.
 */
export const flushChatStream = async (orgId) => {
    const orgStreamKey = `chat:stream:org_${orgId}`;
    try {
        // Read unacked messages from Stream for our consumer group
        // Read up to 1000 messages at once
        const streams = await redisClient.xreadgroup(
            "GROUP", STREAM_GROUP, STREAM_CONSUMER,
            "COUNT", 1000,
            "STREAMS", orgStreamKey, ">"
        );

        if (!streams || !streams.length) return { success: true, count: 0 };

        const messages = streams[0][1]; // Array of [messageId, [ 'payload', '{"..."}' ]]
        if (!messages.length) return { success: true, count: 0 };

        const bulkOps = [];
        const messageIdsToAck = [];

        messages.forEach(([messageId, fields]) => {
            const dataString = fields[1]; 
            const msgData = JSON.parse(dataString);

            bulkOps.push({
                insertOne: {
                    document: {
                        _id: msgData._id,
                        classroom: msgData.classroom,
                        sender: msgData.sender,
                        receiver: msgData.receiver,
                        content: msgData.content,
                        messageType: msgData.messageType,
                        fileUrl: msgData.fileUrl,
                        fileName: msgData.fileName,
                        fileType: msgData.fileType,
                        fileSize: msgData.fileSize,
                        createdAt: new Date(msgData.createdAt)
                    }
                }
            });
            messageIdsToAck.push(messageId);
        });

        if (bulkOps.length > 0) {
            // Adaptive Worker Phase 1: mongo.insertMany equivalent via bulkWrite
            await Message.bulkWrite(bulkOps);
            
            // Adaptive Worker Phase 2: redis.ack()
            await redisClient.xack(orgStreamKey, STREAM_GROUP, ...messageIdsToAck);
            
            // Cleanup standard stream to keep memory minimal
            await redisClient.xdel(orgStreamKey, ...messageIdsToAck);
            
            // Adaptive Worker Phase 3: emit 'message_saved'
            if (io) {
                // Emit to the organization that the batch was successfully persisted
                // Useful for UI updates or read receipts marking
                io.to(orgId).emit('message_saved', { orgId, count: bulkOps.length });
                console.log(`[Socket Adaptive Worker] Flushed & ACKed ${bulkOps.length} messages for org ${orgId}`);
            }
        }
        
        return { success: true, count: bulkOps.length };
    } catch (err) {
        console.error(`[Socket Adaptive Worker] Failed to flush stream for org ${orgId}:`, err);
        return { success: false, error: err.message };
    }
};
