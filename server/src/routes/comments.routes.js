import express from 'express';
import { getChatSb } from '../config/supabaseClient.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { broadcastToChannel } from '../services/realtimeBroadcast.js';

const router = express.Router();

// Centralized Supabase Client
const getSupabase = () => getChatSb();

// GET comments for a specific content (announcement or note)
router.get('/:contentId', isAuthenticated, async (req, res) => {
  const { contentId } = req.params;
  try {
    const { data, error } = await getSupabase()
      .from('content_comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ comments: data });
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST a new comment
router.post('/:contentId', isAuthenticated, async (req, res) => {
  const { contentId } = req.params;
  const { comment } = req.body;
  const user = req.user;
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }
  const newComment = {
    content_id: contentId,
    classroom_id: user.organization_id || null, // optional linking
    user_id: user._id.toString(),
    user_name: user.name,
    user_role: user.role,
    comment: comment.trim(),
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await getSupabase()
      .from('content_comments')
      .insert([newComment])
      .select()
      .single();
    if (error) throw error;
    // Broadcast to realtime channel for this content
    await broadcastToChannel(`comments:${contentId}`, 'new_comment', data);
    res.status(201).json({ comment: data });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a comment (teacher only)
router.delete('/:commentId', isAuthenticated, async (req, res) => {
  const { commentId } = req.params;
  const user = req.user;
  if (user.role !== 'Teacher' && user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only teachers or admins can delete comments' });
  }
  try {
    const { data, error } = await getSupabase()
      .from('content_comments')
      .delete()
      .eq('id', commentId)
      .single();
    if (error) throw error;
    await broadcastToChannel(`comments:${data.content_id}`, 'delete_comment', { id: commentId });
    res.json({ deleted: data });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
