import { Queue, Worker } from "bullmq";
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSession from "../models/AttendanceSession.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import redisClient from "../config/redis.js";

const isDev = process.env.NODE_ENV !== "production";

// In dev without Redis, export a dummy queue that does nothing
export const attendanceQueue = isDev
    ? { add: async () => console.log("[Dev] Attendance queue skipped (no Redis)") }
    : new Queue("AttendanceBatching", { connection: redisClient });

if (!isDev) {
    // A worker to ingest bulk attendance submissions and process them
    // Helps mitigate DB lock spikes during 60s attendance window
    const worker = new Worker("AttendanceBatching", async (job) => {
        const { 
            session_id, classroom_id, student_id, student_name, role, org_id, 
            studentLat, studentLng, distanceMeters, pasteDetected,
            deviceFingerprint, ipAddress, suspicionReasons, isSuspicious, status,
            expectedDevice
        } = job.data;

        try {
            // Step 1: Create the attendance log natively
            await AttendanceRecord.create({
                session: session_id,
                classroom: classroom_id,
                student: student_id,
                status,
                studentLat,
                studentLng,
                distanceMeters,
                pasteDetected,
                deviceFingerprint,
                ipAddress,
                suspicionReasons,
                markedAt: new Date()
            });

            // Step 2: Increment the counter atomically
            await AttendanceSession.findByIdAndUpdate(session_id, { $inc: { presentCount: 1 } });

            // Step 3: Emit audit log if flagged
            if (isSuspicious) {
                await AdminAuditLog.create({
                    action: "attendance_suspicious",
                    actorId: student_id,
                    actorName: student_name,
                    actorRole: role,
                    targetType: "AttendanceSession",
                    targetId: session_id,
                    organization_id: org_id,
                    metadata: {
                        studentId: student_id,
                        classroomId: classroom_id,
                        sessionId: session_id,
                        suspicionReasons,
                        distanceMeters,
                        pasteDetected,
                        deviceFingerprint,
                        expectedDevice,
                        ipAddress
                    },
                });
            }
        } catch (err) {
            // Ignore duplicate key errors silently since it means they already marked it
            if (err.code !== 11000) {
                console.error(`[AttendanceWorker] Failed to process mark for student ${student_id}:`, err.message);
                throw err;
            }
        }
    }, { connection: redisClient });

    worker.on("failed", (job, err) => {
        console.error(`Job ${job?.id} failed:`, err.message);
    });
} else {
    console.log("👷 Attendance Worker skipped (no Redis in dev)");
}

export default attendanceQueue;
