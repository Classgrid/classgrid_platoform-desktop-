import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { primarySupabaseClient as supabase } from '../config/supabaseClient.js';
import { updateStudentCompliance } from '../controllers/student-compliance.controller.js';

const router = express.Router();

// =======================
// FAMILY INFO
// =======================
router.get('/family', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { data, error } = await supabase
            .from('student_family_info')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        res.json({ familyInfo: data || {} });
    } catch (err) {
        console.error('GET family info error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/family', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { father_name, mother_name, parent_contact, emergency_contact } = req.body;

        const payload = {
            user_id: userId,
            father_name: father_name || null,
            mother_name: mother_name || null,
            parent_contact: parent_contact || null,
            emergency_contact: emergency_contact || null,
        };

        const { data, error } = await supabase
            .from('student_family_info')
            .upsert(payload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Family info saved', familyInfo: data });
    } catch (err) {
        console.error('PUT family info error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =======================
// PAST QUALIFICATIONS
// =======================
router.get('/qualifications', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { data, error } = await supabase
            .from('student_past_qualifications')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ qualifications: data || [] });
    } catch (err) {
        console.error('GET qualifications error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/qualifications', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { qual_type, board, passing_year, marks, stream, metadata } = req.body;

        if (!qual_type) return res.status(400).json({ message: 'Qualification type is required' });

        const payload = {
            user_id: userId,
            qual_type,
            board: board || null,
            passing_year: passing_year || null,
            marks: marks || null,
            stream: stream || null,
            metadata: metadata || {}
        };

        const { data, error } = await supabase
            .from('student_past_qualifications')
            .upsert(payload, { onConflict: 'user_id,qual_type' })
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Qualification saved', qualification: data });
    } catch (err) {
        console.error('PUT qualifications error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/qualifications/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { error } = await supabase
            .from('student_past_qualifications')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ message: 'Qualification deleted' });
    } catch (err) {
        console.error('DELETE qualification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =======================
// DOCUMENTS
// =======================
router.get('/documents', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { data, error } = await supabase
            .from('student_documents')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ documents: data || [] });
    } catch (err) {
        console.error('GET documents error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/documents', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { doc_type, file_url } = req.body;

        if (!doc_type || !file_url) return res.status(400).json({ message: 'Doc type and URL required' });

        const payload = {
            user_id: userId,
            doc_type,
            file_url,
        };

        const { data, error } = await supabase
            .from('student_documents')
            .upsert(payload, { onConflict: 'user_id,doc_type' })
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Document saved', document: data });
    } catch (err) {
        console.error('PUT document error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/documents/:doc_type', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { error } = await supabase
            .from('student_documents')
            .delete()
            .eq('user_id', userId)
            .eq('doc_type', req.params.doc_type);

        if (error) throw error;
        res.json({ message: 'Document deleted' });
    } catch (err) {
        console.error('DELETE document error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =======================
// COMPLIANCE (ABC ID, Anti-Ragging)
// =======================
router.put('/compliance', isAuthenticated, updateStudentCompliance);

export default router;
