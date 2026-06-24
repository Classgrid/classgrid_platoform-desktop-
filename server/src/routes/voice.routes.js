import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { transcribeAudio } from '../services/ai/voice.service.js';
import { studentNotesClient } from '../config/supabaseClient.js';
import { broadcastToChannel } from '../services/realtimeBroadcast.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for voice notes
});

/**
 * POST /api/voice/send
 * Handles recording upload, transcription, and instant chat broadcast
 */
router.post('/send', isAuthenticated, upload.single('audio'), async (req, res) => {
    try {
        const file = req.file;
        const { threadId } = req.body;
        const userId = req.user._id.toString();

        if (!file) return res.status(400).json({ error: "No audio file provided" });
        if (!threadId) return res.status(400).json({ error: "No target thread specified" });

        // 1. Transcribe AI instantly
        const transcription = await transcribeAudio(file.buffer, file.originalname);

        // 2. Upload to S3 (Supabase Storage)
        const storagePath = `chat/voice/${threadId}/${Date.now()}_voice.webm`;
        const publicUrl = await uploadBufferToR2(file.buffer, file.buffer.originalname || 'upload.file', file.buffer.mimetype || 'application/octet-stream', storagePath);

        /* Error handled inside R2 */

        const signedData = { signedUrl: publicUrl }; /* Signed URL mocked by R2 public URL */ // 1 year expiry

        const fileUrl = signedData?.signedUrl || storagePath;

        // 3. Broadcast to Socket Channel
        const broadcastPayload = {
            id: `voice_${Date.now()}`,
            thread_id: threadId,
            sender_id: userId,
            sender_name: req.user.name,
            user_avatar: req.user.profilePicture,
            message: `🎤 Voice Message: "${transcription}"`,
            type: 'voice',
            file_url: fileUrl,
            transcription: transcription,
            created_at: new Date().toISOString()
        };

        await broadcastToChannel(`thread:${threadId}`, 'new_message', broadcastPayload);

        res.status(201).json({ 
            success: true, 
            message: broadcastPayload 
        });

    } catch (err) {
        console.error("[Voice Route] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
