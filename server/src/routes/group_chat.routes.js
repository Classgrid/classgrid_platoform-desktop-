import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import { primarySupabaseClient, studentNotesClient } from '../config/supabaseClient.js';
import { broadcastToChannel } from '../services/realtimeBroadcast.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();
const sb = primarySupabaseClient;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB for group photos
});

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
async function getGroupMembership(userId, groupId) {
  // Get group + thread + membership in one flow
  const { data: group } = await sb.from('chat_groups').select('*').eq('id', groupId).single();
  if (!group) return { group: null, thread: null, membership: null };

  const { data: thread } = await sb.from('chat_threads').select('*').eq('group_id', groupId).single();
  if (!thread) return { group, thread: null, membership: null };

  const { data: membership } = await sb
    .from('chat_thread_members')
    .select('*')
    .eq('thread_id', thread.id)
    .eq('user_id', userId)
    .maybeSingle();

  return { group, thread, membership };
}

// ──────────────────────────────────────────────
// POST /groups — Create group
// ──────────────────────────────────────────────
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const orgId = req.user.organization_id?.toString();
    const isSuperAdmin = req.user.role === 'super_admin';
    if (!orgId && !isSuperAdmin) return res.status(403).json({ error: 'Must be in an organization' });

    const { name, description, memberIds } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'At least one member is required' });
    }

    // Validate all members are in the same org
    const allIds = [...new Set([userId, ...memberIds])];
    const users = await User.find({ _id: { $in: allIds } }).select('organization_id name').lean();
    
    let threadOrgId = orgId || null;
    
    if (isSuperAdmin) {
      const firstMemberOrg = users.find(u => u._id.toString() !== userId && u.organization_id)?.organization_id?.toString();
      threadOrgId = firstMemberOrg || null;
    } else {
      const invalidUsers = users.filter(u => u.organization_id?.toString() !== orgId);
      if (invalidUsers.length > 0) {
        return res.status(400).json({ error: 'All members must be from the same organization' });
      }
    }

    // Create group
    const { data: group, error: groupErr } = await sb
      .from('chat_groups')
      .insert([{
        name: name.trim(),
        description: description ? description.trim() : null,
        created_by: userId,
        org_id: threadOrgId,
      }])
      .select()
      .single();
    if (groupErr) throw groupErr;

    // Create thread
    const { data: thread, error: threadErr } = await sb
      .from('chat_threads')
      .insert([{
        type: 'group',
        org_id: threadOrgId,
        group_id: group.id,
      }])
      .select()
      .single();
    if (threadErr) throw threadErr;

    // Add members (creator as admin, rest as members)
    const memberRecords = allIds.map(id => ({
      thread_id: thread.id,
      user_id: id,
      role: id === userId ? 'admin' : 'member',
    }));

    const { error: memErr } = await sb.from('chat_thread_members').insert(memberRecords);
    if (memErr) throw memErr;

    res.status(201).json({ group, thread });
  } catch (err) {
    console.error('Group create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /groups/:id — Group info + members
// ──────────────────────────────────────────────
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(userId, req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    // Get all members
    const { data: members } = await sb
      .from('chat_thread_members')
      .select('user_id, role, joined_at')
      .eq('thread_id', thread.id);

    // Get user profiles from MongoDB
    const memberUserIds = (members || []).map(m => m.user_id).filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    const mongoUsers = await User.find({ _id: { $in: memberUserIds } }).select('name profilePicture role email').lean();
    const userMap = {};
    mongoUsers.forEach(u => { userMap[u._id.toString()] = u; });

    const formattedMembers = (members || []).map(m => {
      const u = userMap[m.user_id];
      return {
        userId: m.user_id,
        name: u?.name || 'User',
        profilePicture: u?.profilePicture || null,
        role: m.role,
        userRole: u?.role || 'student',
        email: u?.email || null,
        joinedAt: m.joined_at,
      };
    });

    res.json({
      group,
      threadId: thread.id,
      members: formattedMembers,
      memberCount: formattedMembers.length,
      myRole: membership.role,
    });
  } catch (err) {
    console.error('Group info error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /groups/:id — Update group info
// ──────────────────────────────────────────────
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(userId, req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Check permissions
    if (membership.role !== 'admin' && group.edit_info_policy === 'admin_only') {
      return res.status(403).json({ error: 'Only admins can edit group info' });
    }

    const { name, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const { data, error } = await sb
      .from('chat_groups')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    // Update thread's updated_at
    await sb.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('group_id', req.params.id);

    res.json({ group: data });
  } catch (err) {
    console.error('Group update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /groups/:id/photo — Upload group photo
// ──────────────────────────────────────────────
router.post('/:id/photo', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(userId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not authorized' });
    
    // Check permissions
    if (membership.role !== 'admin' && group.edit_info_policy === 'admin_only') {
      return res.status(403).json({ error: 'Only admins can change group photo' });
    }

    if (!req.file) return res.status(400).json({ error: 'No photo provided' });

    const type = req.body.type || 'avatar';
    if (type !== 'avatar' && type !== 'banner') return res.status(400).json({ error: 'Invalid photo type' });

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `chat/groups/${req.params.id}/${type}_${Date.now()}_${safeName}`;

    const publicUrl = await uploadBufferToR2(req.file.buffer, req.file.originalname || 'upload.file', req.file.mimetype || 'application/octet-stream', storagePath);

    const updateField = type === 'banner' ? 'banner_url' : 'avatar_url';

    const { data, error } = await sb
      .from('chat_groups')
      .update({ [updateField]: publicUrl })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ group: data });
  } catch (err) {
    console.error('Group photo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /groups/:id/permissions — Update permissions
// ──────────────────────────────────────────────
router.put('/:id/permissions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { group, membership } = await getGroupMembership(userId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not authorized' });

    if (membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change group permissions' });
    }

    const { send_messages, edit_info } = req.body;
    const updates = {};
    if (['all', 'admin_only'].includes(send_messages)) updates.send_messages_policy = send_messages;
    if (['all', 'admin_only'].includes(edit_info)) updates.edit_info_policy = edit_info;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Invalid permission values' });
    }

    const { data, error } = await sb
      .from('chat_groups')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ group: data });
  } catch (err) {
    console.error('Permission update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /groups/:id/admins/:userId — Promote/demote
// ──────────────────────────────────────────────
router.put('/:id/admins/:userId', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const targetId = req.params.userId;
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not authorized' });
    if (membership.role !== 'admin') return res.status(403).json({ error: 'Only admins can manage roles' });

    const { role } = req.body; // 'admin' or 'member'
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const { error } = await sb
      .from('chat_thread_members')
      .update({ role })
      .eq('thread_id', thread.id)
      .eq('user_id', targetId);
    if (error) throw error;

    res.json({ ok: true, userId: targetId, newRole: role });
  } catch (err) {
    console.error('Admin toggle error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /groups/:id/members — Add member
// ──────────────────────────────────────────────
router.post('/:id/members', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const orgId = req.user.organization_id?.toString();
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not authorized' });
    if (membership.role !== 'admin') return res.status(403).json({ error: 'Only admins can add members' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Verify user is in same org
    const targetUser = await User.findById(userId).select('organization_id name').lean();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.organization_id?.toString() !== orgId) {
      return res.status(403).json({ error: 'User is not in your organization' });
    }

    const { error } = await sb
      .from('chat_thread_members')
      .insert([{ thread_id: thread.id, user_id: userId, role: 'member' }]);

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'User is already a member' });
      throw error;
    }

    // Update thread
    await sb.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', thread.id);

    res.status(201).json({ ok: true, userId });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /groups/:id/members/:userId — Remove member
// ──────────────────────────────────────────────
router.delete('/:id/members/:userId', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const targetId = req.params.userId;
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not authorized' });
    if (membership.role !== 'admin') return res.status(403).json({ error: 'Only admins can remove members' });
    if (targetId === group.created_by) return res.status(400).json({ error: 'Cannot remove the group creator' });

    const { error } = await sb
      .from('chat_thread_members')
      .delete()
      .eq('thread_id', thread.id)
      .eq('user_id', targetId);
    if (error) throw error;

    await sb.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', thread.id);

    res.json({ ok: true, removedUserId: targetId });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /groups/:id/exit — Leave group
// ──────────────────────────────────────────────
router.post('/:id/exit', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not a member' });

    // If creator leaves, delete the whole group
    if (myId === group.created_by) {
      return res.status(400).json({ error: 'Group creator cannot exit. Delete the group instead.' });
    }

    const { error } = await sb
      .from('chat_thread_members')
      .delete()
      .eq('thread_id', thread.id)
      .eq('user_id', myId);
    if (error) throw error;

    res.json({ ok: true, leftGroup: req.params.id });
  } catch (err) {
    console.error('Exit group error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /groups/:id — Delete group (creator/admin only)
// ──────────────────────────────────────────────
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete the group' });
    }

    // CASCADE will handle: thread → members, messages → attachments, polls → votes
    const { error } = await sb.from('chat_groups').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ ok: true, deletedGroup: req.params.id });
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /groups/:id/polls — Create poll
// ──────────────────────────────────────────────
router.post('/:id/polls', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not a member' });

    const { question, options, allowMultiple, isAnonymous, closesAt } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Poll question is required' });
    if (!options || !Array.isArray(options) || options.length < 2 || options.length > 10) {
      return res.status(400).json({ error: 'Poll must have 2-10 options' });
    }

    // Format options with IDs
    const formattedOptions = options.map((text, i) => ({
      id: String.fromCharCode(97 + i), // a, b, c, ...
      text: typeof text === 'string' ? text.trim() : text.text?.trim() || '',
    }));

    // Create a system message for the poll
    const { data: msgId, error: rpcErr } = await sb.rpc('send_message_atomic', {
      p_thread_id: thread.id,
      p_sender_id: myId,
      p_sender_name: req.user.name || 'User',
      p_user_avatar: req.user.profilePicture || null,
      p_msg: `📊 Poll: ${question.trim()}`,
      p_reply: null,
    });
    if (rpcErr) throw rpcErr;

    // Create poll record
    const { data: poll, error: pollErr } = await sb
      .from('chat_polls')
      .insert([{
        thread_id: thread.id,
        message_id: msgId,
        question: question.trim(),
        options: formattedOptions,
        allow_multiple: allowMultiple || false,
        is_anonymous: isAnonymous || false,
        created_by: myId,
        closes_at: closesAt || null,
      }])
      .select()
      .single();
    if (pollErr) throw pollErr;

    // Broadcast
    await broadcastToChannel(`thread:${thread.id}`, 'new_poll', {
      poll: {
        ...poll,
        voteCounts: {},
        totalVoters: 0,
        myVotes: [],
      },
      messageId: msgId,
    });

    res.status(201).json({ poll });
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /groups/:id/polls/:pollId/vote — Vote
// ──────────────────────────────────────────────
router.post('/:id/polls/:pollId/vote', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const { pollId } = req.params;
    const { optionId } = req.body;
    if (!optionId) return res.status(400).json({ error: 'optionId is required' });

    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not a member' });

    // Get poll details
    const { data: poll } = await sb.from('chat_polls').select('*').eq('id', pollId).single();
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    // Check if poll is closed
    if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
      return res.status(400).json({ error: 'This poll is closed' });
    }

    // Validate option exists
    const validOptionIds = poll.options.map(o => o.id);
    if (!validOptionIds.includes(optionId)) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // If single-choice: delete previous votes first
    if (!poll.allow_multiple) {
      await sb.from('chat_poll_votes').delete().eq('poll_id', pollId).eq('user_id', myId);
    }

    // Insert vote
    const { error } = await sb
      .from('chat_poll_votes')
      .insert([{ poll_id: pollId, user_id: myId, option_id: optionId }]);

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Already voted for this option' });
      throw error;
    }

    // Get updated vote counts
    const { data: allVotes } = await sb.from('chat_poll_votes').select('option_id, user_id').eq('poll_id', pollId);
    const voteCounts = {};
    (allVotes || []).forEach(v => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
    });

    // Broadcast vote update
    await broadcastToChannel(`thread:${thread.id}`, 'poll_vote', {
      pollId,
      voteCounts,
      totalVoters: new Set((allVotes || []).map(v => v.user_id)).size,
    });

    res.json({ ok: true, voteCounts });
  } catch (err) {
    console.error('Poll vote error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /groups/:id/polls/:pollId/voters — Get voters for a poll
// ──────────────────────────────────────────────
router.get('/:id/polls/:pollId/voters', isAuthenticated, async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const { data: votes } = await sb.from('chat_poll_votes').select('option_id, user_id').eq('poll_id', pollId);
    res.json({ votes: votes || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /groups/:id/polls — List polls in group
// ──────────────────────────────────────────────
router.get('/:id/polls', isAuthenticated, async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const { group, thread, membership } = await getGroupMembership(myId, req.params.id);
    if (!group || !membership) return res.status(403).json({ error: 'Not a member' });

    const { data: polls, error } = await sb
      .from('chat_polls')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Get vote counts for each poll
    const result = await Promise.all((polls || []).map(async (poll) => {
      const { data: votes } = await sb.from('chat_poll_votes').select('option_id, user_id').eq('poll_id', poll.id);
      const voteCounts = {};
      (votes || []).forEach(v => { voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1; });
      const myVotes = (votes || []).filter(v => v.user_id === myId).map(v => v.option_id);

      return {
        ...poll,
        voteCounts,
        totalVoters: new Set((votes || []).map(v => v.user_id)).size,
        myVotes,
      };
    }));

    res.json({ polls: result });
  } catch (err) {
    console.error('List polls error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
