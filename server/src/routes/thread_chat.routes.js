import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import { primarySupabaseClient } from '../config/supabaseClient.js';
import { broadcastToChannel } from '../services/realtimeBroadcast.js';
import { studentNotesClient } from '../config/supabaseClient.js';
import AIAssistantModule from '../services/ai/AIAssistantModule.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();
const sb = primarySupabaseClient;

// Multi-file upload: max 50 files, 40MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 }
});

// ──────────────────────────────────────────────
// RATE LIMITER (in-memory, per user, 30 msg/min)
// ──────────────────────────────────────────────
const rateLimitStore = {};
function checkRateLimit(userId) {
  const now = Date.now();
  if (!rateLimitStore[userId]) rateLimitStore[userId] = [];
  // Purge entries older than 60s
  rateLimitStore[userId] = rateLimitStore[userId].filter(ts => now - ts < 60000);
  if (rateLimitStore[userId].length >= 30) return false;
  rateLimitStore[userId].push(now);
  return true;
}

// ──────────────────────────────────────────────
// VALIDATION HELPERS
// ──────────────────────────────────────────────
async function validateThreadMembership(userId, threadId) {
  const { data, error } = await sb
    .from('chat_thread_members')
    .select('id, role')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data; // null if not a member
}

const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/', 'application/pdf'];
const ALLOWED_MIME_EXACT = [
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-rar-compressed'
];

function isAllowedMime(mimeType) {
  if (ALLOWED_MIME_PREFIXES.some(p => mimeType.startsWith(p))) return true;
  return ALLOWED_MIME_EXACT.includes(mimeType);
}

// ──────────────────────────────────────────────
// GET /threads — List user's threads (LIMIT 50)
// ──────────────────────────────────────────────
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const orgId = req.user.organization_id?.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!orgId && !isSuperAdmin) return res.json({ threads: [] });

    // Get thread IDs where user is a member
    const { data: memberships, error: memErr } = await sb
      .from('chat_thread_members')
      .select('thread_id')
      .eq('user_id', userId);
    if (memErr) throw memErr;

    const threadIds = (memberships || []).map(m => m.thread_id);
    if (threadIds.length === 0) return res.json({ threads: [] });

    // Run threads + reads + members queries IN PARALLEL
    let threadQuery = sb.from('chat_threads').select('*').in('id', threadIds);
    if (!isSuperAdmin) {
      threadQuery = threadQuery.eq('org_id', orgId);
    }
    threadQuery = threadQuery.order('last_message_at', { ascending: false, nullsFirst: false }).limit(50);

    const [threadsResult, readsResult] = await Promise.all([
      threadQuery,
      sb.from('thread_reads').select('thread_id, last_read_at').eq('user_id', userId).in('thread_id', threadIds),
    ]);

    if (threadsResult.error) throw threadsResult.error;
    const threads = threadsResult.data || [];
    const readMap = {};
    (readsResult.data || []).forEach(r => { readMap[r.thread_id] = r.last_read_at; });

    // Now that we have threads, run DM members + group info IN PARALLEL
    const dmThreadIds = threads.filter(t => t.type === 'dm').map(t => t.id);
    const groupIds = threads.filter(t => t.type === 'group' && t.group_id).map(t => t.group_id);

    const [membersResult, groupsResult] = await Promise.all([
      dmThreadIds.length > 0
        ? sb.from('chat_thread_members').select('thread_id, user_id').in('thread_id', dmThreadIds).neq('user_id', userId)
        : { data: [] },
      groupIds.length > 0
        ? sb.from('chat_groups').select('*').in('id', groupIds)
        : { data: [] },
    ]);

    const otherMembers = membersResult.data || [];
    let groupInfoMap = {};
    (groupsResult.data || []).forEach(g => { groupInfoMap[g.id] = g; });

    // Get user profiles from MongoDB
    const otherUserIds = otherMembers.map(m => m.user_id).filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    let userMap = {};
    if (otherUserIds.length > 0) {
      const users = await User.find({ _id: { $in: otherUserIds } }).select('name profilePicture role email phoneNumber bio prn').lean();
      users.forEach(u => { userMap[u._id.toString()] = u; });
    }

    // Calculate unread counts per thread
    const unreadCountPromises = (threads || []).map(async (thread) => {
      const lastRead = readMap[thread.id];
      if (!lastRead) {
        // Never read — count all messages not from me
        const { count } = await sb
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .neq('sender_id', userId);
        return { threadId: thread.id, unread: count || 0 };
      }
      const { count } = await sb
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .neq('sender_id', userId)
        .gt('created_at', lastRead);
      return { threadId: thread.id, unread: count || 0 };
    });
    const unreadResults = await Promise.all(unreadCountPromises);
    const unreadMap = {};
    unreadResults.forEach(r => { unreadMap[r.threadId] = r.unread; });

    // Build response
    const otherMemberMap = {};
    otherMembers.forEach(m => { otherMemberMap[m.thread_id] = m.user_id; });

    const formatted = (threads || []).map(thread => {
      if (thread.type === 'dm') {
        const otherUserId = otherMemberMap[thread.id];
        const otherUser = userMap[otherUserId];
        return {
          id: thread.id,
          type: 'dm',
          name: otherUser?.name || 'User',
          avatar: otherUser?.profilePicture || (otherUser?.name || 'U')[0].toUpperCase(),
          role: otherUser?.role === 'student' ? 'Student' : 'Faculty',
          otherUserId,
          email: otherUser?.email || '',
          phoneNumber: otherUser?.phoneNumber || '',
          bio: otherUser?.bio || '',
          prn: otherUser?.prn || '',
          lastMessage: thread.last_message,
          lastMessageAt: thread.last_message_at,
          unread: unreadMap[thread.id] || 0,
          createdAt: thread.created_at,
        };
      } else {
        const group = groupInfoMap[thread.group_id] || {};
        return {
          id: thread.id,
          type: 'group',
          groupId: thread.group_id,
          name: group.name || 'Group',
          description: group.description || '',
          avatar: group.avatar_url || null,
          avatarColor: group.avatar_color || '#1a73e8',
          lastMessage: thread.last_message,
          lastMessageAt: thread.last_message_at,
          unread: unreadMap[thread.id] || 0,
          createdAt: thread.created_at,
        };
      }
    });

    res.json({ threads: formatted });
  } catch (err) {
    console.error('Thread list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /threads/dm/:userId — Find-or-create DM
// ──────────────────────────────────────────────
router.post('/dm/:userId', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const otherId = req.params.userId;
    const myOrgId = req.user.organization_id?.toString();
    const myRole = req.user.role;
    
    if (myId === otherId) return res.status(400).json({ error: 'Cannot message yourself' });

    // Verify other user exists
    const otherUser = await User.findById(otherId).select('name organization_id profilePicture role').lean();
    if (!otherUser) return res.status(404).json({ error: 'User not found' });

    const otherOrgId = otherUser.organization_id?.toString();
    const isCrossTenantAllowed = myRole === 'super_admin' || otherUser.role === 'super_admin';

    if (!isCrossTenantAllowed && (!myOrgId || myOrgId !== otherOrgId)) {
      return res.status(403).json({ error: 'Cannot message users from another organization' });
    }

    // Determine which org_id owns the thread (used for filtering)
    // If one is super_admin, the thread belongs to the standard user's org. If both super, it's null.
    const threadOrgId = myRole === 'super_admin' ? (otherOrgId || null) : myOrgId;

    // Find existing DM thread between these two users
    const { data: myThreads } = await sb
      .from('chat_thread_members')
      .select('thread_id')
      .eq('user_id', myId);

    const { data: theirThreads } = await sb
      .from('chat_thread_members')
      .select('thread_id')
      .eq('user_id', otherId);

    const myThreadIds = new Set((myThreads || []).map(t => t.thread_id));
    const commonThreadIds = (theirThreads || []).filter(t => myThreadIds.has(t.thread_id)).map(t => t.thread_id);

    if (commonThreadIds.length > 0) {
      // Check if any of these are DM threads
      const { data: dmThreads } = await sb
        .from('chat_threads')
        .select('*')
        .in('id', commonThreadIds)
        .eq('type', 'dm');

      if (dmThreads && dmThreads.length > 0) {
        return res.json({ thread: dmThreads[0], isNew: false });
      }
    }

    // Create new DM thread
    const { data: newThread, error: createErr } = await sb
      .from('chat_threads')
      .insert([{
        type: 'dm',
        org_id: threadOrgId,
        group_id: null,
        last_message: null,
        last_message_at: null,
      }])
      .select()
      .single();
    if (createErr) throw createErr;

    // Add both members
    const { error: memberErr } = await sb
      .from('chat_thread_members')
      .insert([
        { thread_id: newThread.id, user_id: myId, role: 'member' },
        { thread_id: newThread.id, user_id: otherId, role: 'member' },
      ]);
    if (memberErr) throw memberErr;

    res.status(201).json({ thread: newThread, isNew: true });
  } catch (err) {
    console.error('DM create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /threads/:id/messages — Cursor-based pagination
// ──────────────────────────────────────────────
router.get('/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const threadId = req.params.id;
    const { before } = req.query; // cursor timestamp

    // Run membership + messages query IN PARALLEL
    const [membership, msgResult] = await Promise.all([
      validateThreadMembership(userId, threadId),
      (() => {
        let query = sb.from('chat_messages').select('*').eq('thread_id', threadId)
          .order('created_at', { ascending: false }).limit(50);
        if (before) query = query.lt('created_at', before);
        return query;
      })()
    ]);
    if (!membership) return res.status(403).json({ error: 'Not a member of this thread' });
    const { data: messages, error } = msgResult;
    if (error) throw error;

    // Fetch attachments and reactions for these messages
    const messageIds = (messages || []).map(m => m.id);
    let attachments = [];
    let reactions = [];
    if (messageIds.length > 0) {
      const [attResult, reactResult] = await Promise.all([
        sb.from('chat_attachments').select('*').in('message_id', messageIds),
        sb.from('chat_reactions').select('message_id, emoji, user_id').in('message_id', messageIds),
      ]);
      attachments = attResult.data || [];
      reactions = reactResult.data || [];
    }

    // Group attachments by message_id
    const attachmentMap = {};
    attachments.forEach(a => {
      if (!attachmentMap[a.message_id]) attachmentMap[a.message_id] = [];
      attachmentMap[a.message_id].push(a);
    });

    // Group reactions by message_id → emoji → [user_ids]
    const reactionMap = {};
    reactions.forEach(r => {
      if (!reactionMap[r.message_id]) reactionMap[r.message_id] = {};
      if (!reactionMap[r.message_id][r.emoji]) reactionMap[r.message_id][r.emoji] = [];
      reactionMap[r.message_id][r.emoji].push(r.user_id);
    });

    // Fetch thread reads to determine 'isSeen' for sent messages
    const { data: reads } = await sb.from('thread_reads').select('user_id, last_read_at').eq('thread_id', threadId);
    // Find the latest read timestamp among OTHER users (for DMs)
    let latestOtherReadAt = null;
    if (reads && reads.length > 0) {
      const otherReads = reads.filter(r => r.user_id !== userId && r.last_read_at);
      if (otherReads.length > 0) {
        // use the most recent read timestamp among peers
        latestOtherReadAt = otherReads.reduce((max, r) => r.last_read_at > max ? r.last_read_at : max, otherReads[0].last_read_at);
      }
    }

    // Attach files + reactions to messages and reverse to chronological order
    const result = (messages || []).map(m => {
      // Message is seen if it was created before or exactly at the time another user read the thread
      const isSeen = latestOtherReadAt ? new Date(m.created_at) <= new Date(latestOtherReadAt) : false;
      return {
        ...m,
        attachments: attachmentMap[m.id] || [],
        reactions: reactionMap[m.id] || {},
        isSeen,
        // Hide content for deleted messages
        message: m.is_deleted ? 'This message was deleted' : m.message,
      };
    }).reverse();

    res.json({ messages: result });
  } catch (err) {
    console.error('Message fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /threads/:id/messages — Send message (atomic)
// ──────────────────────────────────────────────
router.post('/:id/messages', isAuthenticated, upload.array('files', 50), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const threadId = req.params.id;
    const { message, replyTo } = req.body;
    const files = req.files || [];
    const msgText = message?.trim() || '';

    // Rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Max 30 messages per minute.' });
    }

    // Empty guard
    if (!msgText && files.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Message length
    if (msgText.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
    }

    // ── PARALLEL: Validate membership + fetch thread in one round-trip ──
    const [membershipResult, threadResult] = await Promise.all([
      validateThreadMembership(userId, threadId),
      sb.from('chat_threads').select('org_id, type, group_id').eq('id', threadId).single(),
    ]);

    const membership = membershipResult;
    if (!membership) return res.status(403).json({ error: 'Not a member of this thread' });

    const thread = threadResult.data;
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    const isSuperAdmin = req.user.role === 'super_admin';
    if (!isSuperAdmin && thread.org_id && thread.org_id !== req.user.organization_id?.toString()) {
      return res.status(403).json({ error: 'Organization mismatch' });
    }

    // Check group send_messages permission (only if group)
    if (thread.type === 'group' && thread.group_id) {
      const { data: group } = await sb.from('chat_groups').select('permissions').eq('id', thread.group_id).single();
      if (group?.permissions?.send_messages === 'admin_only' && membership.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can send messages in this group' });
      }
    }

    // Validate file types (local, no DB call)
    for (const file of files) {
      if (!isAllowedMime(file.mimetype)) {
        return res.status(400).json({ error: `File type not allowed: ${file.mimetype}` });
      }
    }

    // Parse reply_to (local, no DB call)
    let replyData = null;
    if (replyTo) {
      try {
        replyData = typeof replyTo === 'string' ? JSON.parse(replyTo) : replyTo;
      } catch { replyData = null; }
    }

    // Insert message directly
    const now = new Date().toISOString();
    const { data: insertedMsg, error: insertErr } = await sb.from('chat_messages').insert({
      thread_id: threadId,
      sender_id: userId,
      sender_name: req.user.name || 'User',
      user_avatar: req.user.profilePicture || null,
      message: msgText || '',
      reply_to: replyData,
      created_at: now
    }).select('id').single();
    
    if (insertErr) {
      console.error("[Message Insert Error]", insertErr);
      return res.status(500).json({ error: 'Failed to send message' });
    }
    const msgId = insertedMsg.id;

    // Update thread metadata manually
    sb.from('chat_threads')
      .update({ 
        last_message: msgText || (files.length > 0 ? '📎 File' : ''), 
        last_message_at: now 
      })
      .eq('id', threadId)
      .then(() => {})
      .catch(() => {});

    // ── Build response from known data instead of re-fetching ──
    const broadcastPayload = {
      id: msgId,
      thread_id: threadId,
      sender_id: userId,
      sender_name: req.user.name || 'User',
      user_avatar: req.user.profilePicture || null,
      message: msgText || '',
      reply_to: replyData,
      is_deleted: false,
      created_at: now,
      attachments: [],
    };

    // ── Asynchronous Global Ping (Fire-and-forget) ──
    // Alert ALL thread members via their global user channel so their sidebars update
    sb.from('chat_thread_members').select('user_id').eq('thread_id', threadId).then(({ data: members }) => {
      if (members) {
        members.forEach((m) => {
          if (m.user_id !== userId) {
            broadcastToChannel(`user:${m.user_id}`, 'thread_updated', {
              threadId,
              messageId: msgId,
              message: broadcastPayload, // Instantly inject the full message for zero-latency sidebar updates!
            });
          }
        });
      }
    }).catch(err => console.error('Failed to broadcast to global channels:', err));

    // ── RESPOND IMMEDIATELY for text-only messages ──
    if (files.length === 0) {
      // Guaranteed Server Broadcast (await it to bypass Vercel serverless freezing)
      await broadcastToChannel(`thread:${threadId}`, 'new_message', broadcastPayload);
      res.status(201).json({ message: broadcastPayload });
      return;
    }

    // ── Files: update last_message + upload (slower path) ──
    sb.from('chat_threads')
      .update({ last_message: `📎 ${files.length} file${files.length > 1 ? 's' : ''}` })
      .eq('id', threadId)
      .then(() => {})
      .catch(() => {});

    const uploadedAttachments = [];
    for (const file of files) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `chat/threads/${threadId}/${Date.now()}_${safeName}`;

      const publicUrl = await uploadBufferToR2(file.buffer, file.buffer.originalname || 'upload.file', file.buffer.mimetype || 'application/octet-stream', storagePath);
      /* Error handled by route try-catch */

      const signedData = { signedUrl: publicUrl }; /* Signed URL mocked by R2 public URL */

      const attRecord = {
        message_id: msgId,
        file_url: signedData?.signedUrl || storagePath,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
      };

      const { data: att, error: attErr } = await sb
        .from('chat_attachments')
        .insert([attRecord])
        .select()
        .single();
      if (!attErr && att) uploadedAttachments.push(att);
    }

    broadcastPayload.attachments = uploadedAttachments;

    // Broadcast with attachments
    broadcastToChannel(`thread:${threadId}`, 'new_message', broadcastPayload);

    res.status(201).json({ message: broadcastPayload });
  } catch (err) {
    console.error('Message send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /threads/:id/read — Mark thread as read
// ──────────────────────────────────────────────
router.post('/:id/read', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const threadId = req.params.id;

    const membership = await validateThreadMembership(userId, threadId);
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Upsert thread_reads
    const { error } = await sb
      .from('thread_reads')
      .upsert({
        thread_id: threadId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'thread_id,user_id' });
    if (error) throw error;

    // Broadcast read receipt (fire-and-forget — don't let Supabase Realtime failures crash this endpoint)
    broadcastToChannel(`thread:${threadId}`, 'read_receipt', {
      userId,
      lastReadAt: new Date().toISOString(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /threads/:id/messages/:msgId — Soft delete
// ──────────────────────────────────────────────
router.delete('/:id/messages/:msgId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id: threadId, msgId } = req.params;

    const membership = await validateThreadMembership(userId, threadId);
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Verify message exists and belongs to sender
    const { data: msg } = await sb.from('chat_messages').select('sender_id').eq('id', msgId).single();
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id !== userId) return res.status(403).json({ error: 'Can only delete your own messages' });

    // Delete attachments from DB (and optionally from storage)
    const { data: attachments } = await sb.from('chat_attachments').select('file_url').eq('message_id', msgId);
    await sb.from('chat_attachments').delete().eq('message_id', msgId);

    // Soft delete the message
    const { error } = await sb
      .from('chat_messages')
      .update({ message: 'This message was deleted', is_deleted: true })
      .eq('id', msgId);
    if (error) throw error;

    // Broadcast delete event (fire-and-forget)
    broadcastToChannel(`thread:${threadId}`, 'message_deleted', { messageId: msgId });

    res.json({ ok: true });
  } catch (err) {
    console.error('Message delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /threads/:id/messages/:msgId/reactions — Toggle reaction
// ──────────────────────────────────────────────
router.post('/:id/messages/:msgId/reactions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userName = req.user.name || 'User';
    const { id: threadId, msgId } = req.params;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

    const membership = await validateThreadMembership(userId, threadId);
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Check if reaction already exists
    const { data: existing } = await sb
      .from('chat_reactions')
      .select('id')
      .eq('message_id', msgId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      // Remove reaction
      await sb.from('chat_reactions').delete().eq('id', existing.id);
    } else {
      // Add reaction
      await sb.from('chat_reactions').insert({
        message_id: msgId,
        user_id: userId,
        user_name: userName,
        emoji,
      });
    }

    // Fetch updated reactions for this message
    const { data: reactions } = await sb
      .from('chat_reactions')
      .select('emoji, user_id, user_name')
      .eq('message_id', msgId);

    // Group by emoji (include user_name for frontend display)
    const grouped = {};
    (reactions || []).forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push({ id: r.user_id, name: r.user_name });
    });

    // Broadcast to thread
    broadcastToChannel(`thread:${threadId}`, 'reaction_update', {
      messageId: msgId,
      reactions: grouped,
    });

    res.json({ ok: true, reactions: grouped });
  } catch (err) {
    console.error('Reaction toggle error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PATCH /threads/:id/messages/:msgId — Edit message
// ──────────────────────────────────────────────
router.patch('/:id/messages/:msgId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id: threadId, msgId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const membership = await validateThreadMembership(userId, threadId);
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Ensure the user actually sent this message
    const { data: existingMsg } = await sb
      .from('chat_messages')
      .select('sender_id, is_deleted')
      .eq('id', msgId)
      .maybeSingle();

    if (!existingMsg) return res.status(404).json({ error: 'Message not found' });
    if (existingMsg.sender_id !== userId) return res.status(403).json({ error: 'Cannot edit messages sent by others' });
    if (existingMsg.is_deleted) return res.status(400).json({ error: 'Cannot edit deleted messages' });

    // Update message
    const { error } = await sb
      .from('chat_messages')
      .update({ message: message.trim() })
      .eq('id', msgId);

    if (error) throw error;
    
    // Broadcast is handled by the client now

    res.json({ ok: true });
  } catch (err) {
    console.error('Message edit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AI Assistant Routes
// ==========================================

// Summarize Thread
router.post('/:id/summarize', isAuthenticated, async (req, res) => {
  try {
    const threadId = req.params.id;
    const { data: messages, error } = await primarySupabaseClient
      .from('thread_messages')
      .select('message, sender_name, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!messages || messages.length === 0) return res.json({ summary: 'No messages to summarize.' });

    // Reverse to chronological
    const summary = await AIAssistantModule.summarizeThread(messages.reverse(), 'this thread');
    res.json({ summary });
  } catch (err) {
    console.error('AI Summary Error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Suggest Replies
router.post('/:id/suggest-replies', isAuthenticated, async (req, res) => {
  try {
    const threadId = req.params.id;
    const { data: messages, error } = await primarySupabaseClient
      .from('thread_messages')
      .select('message, sender_name, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!messages || messages.length === 0) return res.json({ replies: [] });

    const replies = await AIAssistantModule.suggestReplies(messages.reverse());
    res.json({ replies });
  } catch (err) {
    console.error('AI Smart Reply Error:', err);
    res.status(500).json({ error: 'Failed to generate smart replies' });
  }
});

// Convert to Notes
router.post('/:id/notes', isAuthenticated, async (req, res) => {
  try {
    const threadId = req.params.id;
    const studentId = req.user.id;

    // Fetch last 100 messages for deep context
    const { data: messages, error: fetchErr } = await primarySupabaseClient
      .from('thread_messages')
      .select('message, sender_name, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchErr) throw fetchErr;
    if (!messages || messages.length === 0) return res.status(400).json({ error: 'No chat history to convert.' });

    // Generate markdown string
    const markdownNotes = await AIAssistantModule.convertToNotes(messages.reverse());

    // Automatically push to the student's personal `student_notes` platform DB
    const { data: noteInsert, error: insertErr } = await studentNotesClient
      .from('student_notes')
      .insert({
        student_id: studentId,
        title: `Auto-Notes: Chat Thread Analysis`,
        content: markdownNotes,
        type: 'chat_summary',
        source_id: threadId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertErr) {
        console.error('Notes Save Error:', insertErr);
        // We can just return the text so the user still sees it instead of failing absolutely.
        return res.json({ notes: markdownNotes, saved: false });
    }

    res.json({ notes: markdownNotes, saved: true, noteId: noteInsert.id });
  } catch (err) {
    console.error('AI Convert to Notes Error:', err);
    res.status(500).json({ error: 'Failed to convert chat to notes' });
  }
});

export default router;
