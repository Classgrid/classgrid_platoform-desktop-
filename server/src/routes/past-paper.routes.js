import express from 'express';
import multer from 'multer';
import {
    ingestPastPaper,
    analyzeMultiYear,
    generateMockFromPastPapers,
    listPastPapers
} from '../services/ai/past-paper-analysis.service.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB per paper image
});

/**
 * POST /api/past-papers/ingest
 * Upload a question paper image → OCR → Extract → Store → Auto-classify
 */
router.post('/ingest', upload.single('file'), async (req, res) => {
    try {
        const { title, subject, year, month, semester, branch, university, examType } = req.body;
        const classroomId = req.body.classroomId;
        const organizationId = req.body.organizationId;
        const uploadedBy = req.body.userId;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!title || !subject || !year) {
            return res.status(400).json({ error: 'title, subject, and year are required' });
        }

        const paper = await ingestPastPaper({
            imageBuffer: req.file.buffer,
            mimeType: req.file.mimetype,
            title,
            subject,
            year: parseInt(year),
            month,
            semester: semester ? parseInt(semester) : null,
            branch,
            university,
            examType,
            classroomId,
            organizationId,
            uploadedBy,
            fileUrl: '', // Can be set after Supabase upload
        });

        res.json({
            success: true,
            paperId: paper._id,
            questionsExtracted: paper.totalQuestions,
            status: paper.status,
            message: `Extracted ${paper.totalQuestions} questions. AI topic classification running in background.`,
        });
    } catch (error) {
        console.error('[PastPaper] Ingest error:', error);
        res.status(500).json({ error: 'Failed to process paper', details: error.message });
    }
});

/**
 * GET /api/past-papers/analyze
 * Multi-year analysis — repeated questions + topic frequency
 * 
 * Query params: subject, yearWindow (2|3|4|5|7|10), classroomId, organizationId
 */
router.get('/analyze', async (req, res) => {
    try {
        const { subject, yearWindow, classroomId, organizationId } = req.query;

        if (!subject) return res.status(400).json({ error: 'subject is required' });

        const validWindows = [2, 3, 4, 5, 7, 10];
        const window = parseInt(yearWindow) || 5;
        if (!validWindows.includes(window)) {
            return res.status(400).json({ error: `yearWindow must be one of: ${validWindows.join(', ')}` });
        }

        const analysis = await analyzeMultiYear({
            classroomId,
            organizationId,
            subject,
            yearWindow: window,
        });

        res.json(analysis);
    } catch (error) {
        console.error('[PastPaper] Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

/**
 * GET /api/past-papers/mock-test
 * Generate an AI mock test from repeated + important questions
 * 
 * Query params: subject, yearWindow, questionCount, classroomId, organizationId
 */
router.get('/mock-test', async (req, res) => {
    try {
        const { subject, yearWindow, questionCount, classroomId, organizationId } = req.query;

        if (!subject) return res.status(400).json({ error: 'subject is required' });

        const mock = await generateMockFromPastPapers({
            classroomId,
            organizationId,
            subject,
            yearWindow: parseInt(yearWindow) || 5,
            questionCount: parseInt(questionCount) || 20,
        });

        if (mock.error) return res.status(404).json(mock);
        res.json(mock);
    } catch (error) {
        console.error('[PastPaper] Mock test error:', error);
        res.status(500).json({ error: 'Mock test generation failed', details: error.message });
    }
});

/**
 * GET /api/past-papers/list
 * List all uploaded papers for a classroom/org
 * 
 * Query params: classroomId, organizationId, subject (optional)
 */
router.get('/list', async (req, res) => {
    try {
        const { classroomId, organizationId, subject } = req.query;
        const papers = await listPastPapers({ classroomId, organizationId, subject });
        res.json({ papers, total: papers.length });
    } catch (error) {
        console.error('[PastPaper] List error:', error);
        res.status(500).json({ error: 'Failed to list papers' });
    }
});

export default router;
