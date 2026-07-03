import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import Organization from '../models/Organization.js';
import { transcribeAudio } from '../services/ai/voice.service.js';
import { primarySupabaseClient, studentNotesClient } from '../config/supabaseClient.js';
import { broadcastToChannel } from '../services/realtimeBroadcast.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();
const sb = primarySupabaseClient;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for voice notes
});

function toStorageSlug(value, fallback = 'unknown') {
    const raw = String(value || fallback).trim().toLowerCase();
    const ascii = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return ascii
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || fallback;
}

function shortStorageId(value) {
    return String(value || 'unknown').replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'unknown';
}

function sanitizeStorageFileName(fileName) {
    const fallback = `voice-${Date.now()}.webm`;
    return String(fileName || fallback)
        .replace(/[\\/:*?"<>|]+/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 120) || fallback;
}

async function getVoiceStorageContext(thread, threadId) {
    let group = null;
    if (thread.type === 'group' && thread.group_id) {
        const { data } = await sb.from('chat_groups').select('name').eq('id', thread.group_id).maybeSingle();
        group = data;
    }

    let orgLabel = thread.org_id || 'platform';
    if (thread.org_id && /^[0-9a-fA-F]{24}$/.test(thread.org_id)) {
        try {
            const org = await Organization.findById(thread.org_id)
                .select('name sidebar_name subdomain')
                .lean();
            orgLabel = org?.subdomain || org?.sidebar_name || org?.name || orgLabel;
        } catch (err) {
            console.warn('[Voice Storage] Failed to resolve organization name:', err.message);
        }
    }

    const chatLabel = thread.type === 'group'
        ? group?.name || `group-${thread.group_id || threadId}`
        : `direct-message-${threadId}`;

    return {
        orgFolder: `${toStorageSlug(orgLabel, 'platform')}-${shortStorageId(thread.org_id)}`,
        chatTypeFolder: thread.type === 'group' ? 'groups' : 'direct-messages',
        chatFolder: `${toStorageSlug(chatLabel, thread.type === 'group' ? 'group-chat' : 'direct-message')}-${shortStorageId(threadId)}`,
    };
}

function buildVoiceStoragePath(file, context) {
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const safeName = sanitizeStorageFileName(file.originalname || 'voice.webm');

    return [
        'chat',
        'orgs',
        context.orgFolder,
        context.chatTypeFolder,
        context.chatFolder,
        'audio',
        year,
        month,
        `${Date.now()}-${randomUUID()}-${safeName}`,
    ].join('/');
}

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

        const { data: thread } = await sb
            .from('chat_threads')
            .select('org_id, type, group_id')
            .eq('id', threadId)
            .single();
        if (!thread) return res.status(404).json({ error: "Thread not found" });

        const { data: membership } = await sb
            .from('chat_thread_members')
            .select('id')
            .eq('thread_id', threadId)
            .eq('user_id', userId)
            .maybeSingle();
        if (!membership) return res.status(403).json({ error: "Not a member of this thread" });

        const storageContext = await getVoiceStorageContext(thread, threadId);

        // 1. Transcribe AI instantly
        const transcription = await transcribeAudio(file.buffer, file.originalname);

        // 2. Upload voice note to Cloudflare R2 under org/chat/audio folders
        const storagePath = buildVoiceStoragePath(file, storageContext);
        const publicUrl = await uploadBufferToR2(file.buffer, file.originalname || 'upload.file', file.mimetype || 'application/octet-stream', storagePath);

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
