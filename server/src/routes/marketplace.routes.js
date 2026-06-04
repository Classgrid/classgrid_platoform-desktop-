import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import NotePackage from '../models/NotePackage.js';
import { studentNotesClient } from '../config/supabaseClient.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for PDFs
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/marketplace/upload
 * Seller uploads a note package
 */
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        const { title, description, subject, branch, price } = req.body;
        const file = req.file;
        const userId = req.user._id;
        const orgId = req.user.organization_id;

        if (!file) return res.status(400).json({ error: "PDF file is required" });

        // 1. Upload to S3
        const storagePath = `marketplace/notes/${userId}/${Date.now()}_${file.originalname}`;
        const { error: uploadErr } = await studentNotesClient.storage
            .from('notes-files')
            .upload(storagePath, file.buffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadErr) throw uploadErr;

        // 2. Create Note Entry
        const newNote = new NotePackage({
            sellerId: userId,
            orgId: orgId,
            title,
            description,
            subject,
            branch,
            price: parseFloat(price) || 0,
            fileUrl: storagePath,
            isApproved: true // Auto-approved for now in Dev
        });

        await newNote.save();
        res.status(201).json({ success: true, note: newNote });

    } catch (err) {
        console.error("[Marketplace upload] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/marketplace/list
 * Fetch all available notes in the organization
 */
router.get('/list', isAuthenticated, async (req, res) => {
    try {
        const orgId = req.user.organization_id;
        const notes = await NotePackage.find({ orgId, isApproved: true })
            .populate('sellerId', 'name profilePicture')
            .sort({ createdAt: -1 });
        
        res.json({ notes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/marketplace/buy/:id
 * Generate Razorpay order for a note
 */
router.post('/buy/:id', isAuthenticated, async (req, res) => {
    try {
        const note = await NotePackage.findById(req.params.id);
        if (!note) return res.status(404).json({ error: "Note not found" });

        if (note.price === 0) {
            return res.json({ free: true, url: note.fileUrl });
        }

        const options = {
            amount: note.price * 100, // in paisa
            currency: "INR",
            receipt: `note_${note._id}_${Date.now()}`,
            notes: {
                noteId: note._id.toString(),
                buyerId: req.user._id.toString()
            }
        };

        const order = await razorpay.orders.create(options);
        res.json({ order, key_id: process.env.RAZORPAY_KEY_ID });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
