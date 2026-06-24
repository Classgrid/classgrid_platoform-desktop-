import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { requireClassroomMember } from '../middleware/classroom.middleware.js';
import { broadcastToChannel } from '../services/realtimeBroadcast.js';
import { studentNotesClient, primarySupabaseClient } from '../config/supabaseClient.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// ─────────────────────────────────────────────
// AUTO-DELETE: Purge messages older than 48 hours
// ─────────────────────────────────────────────
const MESSAGE_TTL_HOURS = 48;
let lastPurgeTime = 0;
const PURGE_COOLDOWN_MS = 10 * 60 * 1000;

async function purgeOldMessages() {
    try {
        const cutoff = new Date(Date.now() - MESSAGE_TTL_HOURS * 60 * 60 * 1000).toISOString();
        const { data, error } = await primarySupabaseClient
            .from('classroom_messages')
            .delete()
            .lt('created_at', cutoff)
            .select('id');
        if (error) { console.error('[Chat Cleanup] Purge error:', error.message); return 0; }
        const count = data?.length || 0;
        if (count > 0) console.log(`[Chat Cleanup] Purged ${count} messages older than ${MESSAGE_TTL_HOURS}h`);
        return count;
    } catch (err) {
        console.error('[Chat Cleanup] Unexpected error:', err.message);
        return 0;
    }
}

async function lazyPurge() {
    const now = Date.now();
    if (now - lastPurgeTime < PURGE_COOLDOWN_MS) return;
    lastPurgeTime = now;
    purgeOldMessages().catch(() => {});
}

// ─────────────────────────────────────────────
// CLEANUP ENDPOINT (for Vercel Cron)
// ─────────────────────────────────────────────
router.get('/cleanup', async (req, res) => {
    const secret = req.headers['authorization']?.replace('Bearer ', '');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const deleted = await purgeOldMessages();
    res.json({ message: `Cleanup complete. ${deleted} messages purged.`, deletedCount: deleted, ttlHours: MESSAGE_TTL_HOURS, timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// GET MESSAGES
// ─────────────────────────────────────────────
router.get('/:id', isAuthenticated, requireClassroomMember, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, before } = req.query;

        lazyPurge();

        let query = primarySupabaseClient
            .from('classroom_messages')
            .select('*')
            .eq('classroom_id', id)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (before) query = query.lt('created_at', before);

        const { data, error } = await query;
        if (error) throw error;

        res.json({ messages: data.reverse() });
    } catch (err) {
        console.error('Chat fetch error:', err);
        res.status(500).json({ message: 'Error fetching messages', error: err.message });
    }
});

// ─────────────────────────────────────────────
// SEND MESSAGE (text + optional file)
// ─────────────────────────────────────────────
router.post('/:id', isAuthenticated, requireClassroomMember, upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { message, content, replyTo } = req.body;
        const textContent = (message || content || '').trim();
        const file = req.file;
        const user = req.user;

        if (!textContent && !file) {
            return res.status(400).json({ message: 'Message content or file required' });
        }

        const newMessage = {
            classroom_id: id,
            sender_id: user._id.toString(),
            sender_name: user.name,
            user_avatar: user.profilePicture || null,
            message: textContent,
            created_at: new Date().toISOString(),
            reply_to: replyTo ? (typeof replyTo === 'string' ? JSON.parse(replyTo) : replyTo) : null,
            // File attachment fields
            file_url: null,
            file_name: null,
            file_type: null,
            file_size: null,
        };

        // Handle file upload if present
        if (file) {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `chat/classroom/${id}/${user._id}/${Date.now()}_${safeName}`;

            const publicUrl = await uploadBufferToR2(file.buffer, file.buffer.originalname || 'upload.file', file.buffer.mimetype || 'application/octet-stream', storagePath);

            newMessage.file_url = publicUrl;
            newMessage.file_name = file.originalname;
            newMessage.file_type = file.mimetype;
            newMessage.file_size = file.size;
        }

        const { data, error } = await primarySupabaseClient
            .from('classroom_messages')
            .insert([newMessage])
            .select()
            .single();

        if (error) throw error;

        // Broadcast to classroom realtime channel for instant delivery
        await broadcastToChannel(`classroom:${id}`, 'new_message', data);

        res.status(201).json({ message: data });
    } catch (err) {
        console.error('Chat send error:', err);
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
});

export default router;
