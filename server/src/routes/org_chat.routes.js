import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import User from '../models/User.js'; // MongoDB User model
import { broadcastToChannel } from '../services/realtimeBroadcast.js';
import { studentNotesClient, primarySupabaseClient } from '../config/supabaseClient.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// ─────────────────────────────────────────────
// GET list of users in the same organization
// ─────────────────────────────────────────────
router.get('/users', isAuthenticated, async (req, res) => {
  const user = req.user;
  try {
    // 🔐 SECURITY: Cross-tenant logic for Super Admins
    let query = {};
    const topAdminRoles = ['org_admin', 'principal', 'vice_principal', 'hod', 'exam_controller', 'fee_manager', 'admission_head', 'library_manager', 'transport_manager'];

    if (user.role === 'super_admin') {
      // RULE 1: Super admins see all other super_admins + all top admins from EVERY org
      query = { role: { $in: ['super_admin', ...topAdminRoles] } };
    } else if (topAdminRoles.includes(user.role)) {
      // RULE 2: Org Admins & Dept Heads see their org's users + Platform Support (super_admin)
      query = {
        $or: [
          { organization_id: user.organization_id },
          { role: 'super_admin' }
        ]
      };
    } else if (user.organization_id) {
      // RULE 3: Regular students & teachers ONLY see their own org (No super admins)
      query = { organization_id: user.organization_id };
    } else {
      return res.json({ users: [] });
    }

    const members = await User.find(query, 'name role email profilePicture profileBanner phoneNumber bio prn _id organization_id metadata')
      .populate('organization_id', 'name logo_url')
      .lean();
      
    // Fetch forum usernames
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    let forumMap = {};
    if (db && members.length > 0) {
      const emails = members.map(m => m.email).filter(Boolean);
      const forumUsers = await db.collection("forumusers").find({ email: { $in: emails } }).toArray();
      forumUsers.forEach(f => {
        if (f.email) forumMap[f.email] = f.username;
      });
    }

    const formatted = members.map(m => ({
      _id: m._id.toString(),
      name: m.name,
      email: m.email || null,
      role: m.role,
      profilePicture: m.profilePicture || null,
      profileBanner: m.profileBanner || null,
      phoneNumber: m.phoneNumber || null,
      bio: m.bio || null,
      prn: m.prn || null,
      forumUsername: forumMap[m.email] || null,
      metadata: m.metadata || {},
      organization_name: m.organization_id?.name || null,
      organization_logo: m.organization_id?.logo_url || null,
    }));
    res.json({ users: formatted });
  } catch (err) {
    console.error('Org users fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET unread message counts per conversation
// ─────────────────────────────────────────────
router.get('/unread-counts', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    if (!userId) return res.json({ counts: {} });
    
    // Fetch messages received by this user that have no read_at timestamp.
    // If the read_at column doesn't exist yet (migration not run), return {}.
    const { data, error } = await primarySupabaseClient
      .from('org_direct_messages')
      .select('sender_id, read_at')
      .eq('receiver_id', userId);

    if (error) {
      // Column might not exist yet — return empty counts without crashing
      console.warn('Unread counts query error (run SQL migration?):', error.message);
      return res.json({ counts: {} });
    }

    // Count rows where read_at is null (unread)
    const counts = {};
    (data || []).forEach(row => {
      if (!row.read_at) {
        counts[row.sender_id] = (counts[row.sender_id] || 0) + 1;
      }
    });

    res.json({ counts });
  } catch (err) {
    console.error('Unread counts error:', err);
    // Don't crash the UI — return empty counts
    res.status(500).json({ counts: {}, error: err.message || JSON.stringify(err) });
  }
});

// ─────────────────────────────────────────────
// POST mark messages as read from a sender
// ─────────────────────────────────────────────
router.post('/messages/:otherUserId/read', isAuthenticated, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user?._id?.toString() || req.user?.id;
    if (!userId || !otherUserId) return res.json({ ok: false, message: 'Missing IDs' });

    const { error } = await primarySupabaseClient
      .from('org_direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .is('read_at', null);

    if (error) {
      // read_at column may not exist yet (migration pending) — degrade gracefully
      console.warn('Mark read error (run SQL migration?):', error.message);
      // Still broadcast seen so ticks update in UI
    }

    // Broadcast seen event regardless of DB update success
    const channel = `dm:${[userId, otherUserId].sort().join(':')}`;
    await broadcastToChannel(channel, 'seen', { readerId: userId, senderId: otherUserId });

    res.json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    // Don't 500 — just acknowledge
    res.status(500).json({ ok: false, message: err.message || JSON.stringify(err) });
  }
});

// ─────────────────────────────────────────────
// GET direct message history
// ─────────────────────────────────────────────
router.get('/messages/:otherUserId', isAuthenticated, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user?._id?.toString() || req.user?.id;
    const { before } = req.query;

    if (!userId || !otherUserId) return res.json({ messages: [] });

    // Fetch both directions separately then merge — avoids compound and() syntax issues
    // with some Supabase JS client versions
    let qA = primarySupabaseClient
      .from('org_direct_messages')
      .select('*')
      .eq('sender_id', userId)
      .eq('receiver_id', otherUserId)
      .order('created_at', { ascending: true })
      .limit(50);

    let qB = primarySupabaseClient
      .from('org_direct_messages')
      .select('*')
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (before) {
      qA = qA.lt('created_at', before);
      qB = qB.lt('created_at', before);
    }

    const [resA, resB] = await Promise.all([qA, qB]);
    if (resA.error) throw resA.error;
    if (resB.error) throw resB.error;

    // Merge and sort chronologically
    const merged = [...(resA.data || []), ...(resB.data || [])]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-50); // keep latest 50 after merge

    res.json({ messages: merged });
  } catch (err) {
    console.error('DM fetch error:', err);
    res.status(500).json({ error: err.message || JSON.stringify(err) });
  }
});

// ─────────────────────────────────────────────
// POST a new direct message (text + optional file)
// ─────────────────────────────────────────────
router.post('/messages/:otherUserId', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { message, replyTo } = req.body;
    const file = req.file;
    const sender = req.user;
    const senderId = sender?._id?.toString() || sender?.id;

    if (!message && !file) {
      return res.status(400).json({ error: 'Message content or file required' });
    }

    if (!senderId || !otherUserId) return res.status(400).json({ error: 'Missing user IDs' });

    // Build the message row — NO {{ATTACHMENT:...}} embedding ever
    const newMsg = {
      org_id: sender?.organization_id || null,
      sender_id: senderId,
      sender_name: sender?.name || 'User',
      receiver_id: otherUserId,
      message: message ? message.trim() : '',
      created_at: new Date().toISOString(),
      reply_to: replyTo ? (typeof replyTo === 'string' ? JSON.parse(replyTo) : replyTo) : null
    };

    // Handle file upload
    if (file) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `chat/org_dm/${senderId}/${Date.now()}_${safeName}`;

      const publicUrl = await uploadBufferToR2(file.buffer, file.buffer.originalname || 'upload.file', file.buffer.mimetype || 'application/octet-stream', storagePath);

      // Error handled by try-catch

      /* getPublicUrl replaced by R2 */

      newMsg.file_url = publicUrl;
      newMsg.file_name = file.originalname;
      newMsg.file_type = file.mimetype;
      newMsg.file_size = file.size;
    }

    const { data, error } = await primarySupabaseClient
      .from('org_direct_messages')
      .insert([newMsg])
      .select()
      .single();

    if (error) throw error;

    // Broadcast to realtime channel — payload includes all file fields
    const channel = `dm:${[senderId, otherUserId].sort().join(':')}`;
    await broadcastToChannel(channel, 'new_message', data);

    res.status(201).json({ message: data });
  } catch (err) {
    console.error('DM send error:', err);
    res.status(500).json({ error: err.message || JSON.stringify(err) });
  }
});

export default router;
