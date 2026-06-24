import express from 'express';
import multer from 'multer';
import { isAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { primarySupabaseClient, studentNotesClient } from '../config/supabaseClient.js';
import User from '../models/User.js';
import { uploadBufferToR2, deleteFromR2, getPresignedUploadUrl } from "../config/r2Client.js";


const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ======================================================
// ADMIN ROUTES
// ======================================================

// GET all graduated students in the org
router.get('/admin/all', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const orgId = req.user.organization_id.toString();

        const { data, error } = await primarySupabaseClient
            .from('alumni')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch user profiles to join names/PRNs
        const userIds = data.map(a => a.user_id);
        const users = await User.find({ _id: { $in: userIds } }, 'name email prn roll_no profilePicture').lean();
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const enriched = data.map(a => ({
            ...a,
            user_info: userMap[a.user_id] || {}
        }));

        res.json({ alumni: enriched });
    } catch (err) {
        console.error('[Alumni Admin GET All]:', err);
        res.status(500).json({ error: 'Failed to fetch alumni' });
    }
});

// UPDATE Convocation Status
router.post('/admin/status/:id', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const orgId = req.user.organization_id.toString();
        const { id } = req.params;
        const { status } = req.body; // 'pending', 'eligible', 'attended', 'skipped'

        const VALID_STATUSES = ['pending', 'eligible', 'attended', 'skipped'];
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const { data, error } = await primarySupabaseClient
            .from('alumni')
            .update({ convocation_status: status })
            .eq('id', id)
            .eq('org_id', orgId)
            .select()
            .single();

        if (error) throw error;
        res.json({ alumni: data });
    } catch (err) {
        console.error('[Alumni Admin Update Status]:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// UPLOAD Certificate or Transcript
router.post('/admin/upload/:id', isAuthenticated, requireRole('org_admin'), upload.single('file'), async (req, res) => {
    try {
        const orgId = req.user.organization_id.toString();
        const { id } = req.params;
        const { type } = req.body; // 'certificate' or 'transcript'
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });
        if (!['certificate', 'transcript'].includes(type)) return res.status(400).json({ error: 'Invalid file type' });

        const fileExt = file.originalname.split('.').pop();
        const safeName = `${type}_${id}_${Date.now()}.${fileExt}`;
        const filePath = `alumni_documents/${orgId}/${safeName}`;

        const { error: uploadError } = await studentNotesClient.storage
            .from('notes-files') // Reuse notes bucket
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        /* Error handled inside R2 */

        /* getPublicUrl replaced by R2 */

        const fileUrl = publicUrlData.publicUrl;

        // Update DB
        const updateField = type === 'certificate' ? { certificate_url: fileUrl } : { transcript_url: fileUrl };
        const { data, error } = await primarySupabaseClient
            .from('alumni')
            .update(updateField)
            .eq('id', id)
            .eq('org_id', orgId)
            .select()
            .single();

        if (error) throw error;
        res.json({ alumni: data, message: 'Upload successful' });
    } catch (err) {
        console.error('[Alumni Admin Upload]:', err);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// ======================================================
// STUDENT ROUTES
// ======================================================

// GET My Alumni Data
router.get('/me', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const { data, error } = await primarySupabaseClient
            .from('alumni')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows returned
            throw error;
        }

        res.json({ alumni: data || null });
    } catch (err) {
        console.error('[Alumni Student GET]:', err);
        res.status(500).json({ error: 'Failed to fetch alumni data' });
    }
});

export default router;
