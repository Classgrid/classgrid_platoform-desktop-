import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { upload, singleUpload } from '../middleware/upload.middleware.js';
import { uploadBufferToR2, getPresignedUploadUrl } from '../config/r2Client.js';

const router = express.Router();

/**
 * @route   POST /api/upload/image
 * @desc    Uploads a single image to Cloudflare R2 and returns the public URL
 * @access  Private (Authenticated users only)
 */
router.post('/image', isAuthenticated, singleUpload('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        // Validate basic image types (optional but good for security)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        // Upload buffer directly to R2
        const publicUrl = await uploadBufferToR2(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        res.json({
            message: 'Upload successful',
            url: publicUrl
        });
    } catch (err) {
        console.error('[Upload Image Error]:', err);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

/**
 * @route   POST /api/upload/presigned-url
 * @desc    Generates a presigned URL for direct client-to-R2 uploads
 * @access  Private
 */
router.post('/presigned-url', isAuthenticated, async (req, res) => {
    try {
        const { fileName, mimeType } = req.body;

        if (!fileName || !mimeType) {
            return res.status(400).json({ message: 'fileName and mimeType are required' });
        }

        // Get upload URL (valid for 1 hour)
        const urls = await getPresignedUploadUrl(fileName, mimeType);

        res.json({
            message: 'Presigned URL generated',
            uploadUrl: urls.uploadUrl,
            publicUrl: urls.publicUrl
        });
    } catch (err) {
        console.error('[Presigned URL Error]:', err);
        res.status(500).json({ message: 'Failed to generate presigned URL' });
    }
});

export default router;
