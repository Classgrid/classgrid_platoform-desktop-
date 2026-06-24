import { primarySupabaseClient } from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";

/**
 * StorageService — Wrapper for Supabase Storage operations.
 * Handles secure student document uploads for the Admission Engine.
 */
class StorageService {
    constructor() {
        this.bucket = "admission-documents";
    }

    /**
     * Upload a file to Cloudflare R2
     * @param {Buffer} fileBuffer - The file content
     * @param {string} fileName - Original file name
     * @param {string} mimeType - File MIME type
     * @param {string} folderPath - Path within bucket (e.g. "org_id/app_id")
     * @returns {Promise<Object>} { url, path, fullPath }
     */
    async uploadDocument(fileBuffer, fileName, mimeType, folderPath, targetBucket = null) {
        try {
            const { uploadBufferToR2 } = await import("../config/r2Client.js");
            const fileExt = fileName.split('.').pop() || '';
            const uniqueFileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${folderPath}/${uniqueFileName}`;
            const bucketToUse = targetBucket || this.bucket; // R2 ignores targetBucket if we just use our default, but let's keep the signature.

            const publicUrl = await uploadBufferToR2(fileBuffer, fileName, mimeType, filePath);

            return {
                id: uuidv4(),
                name: fileName,
                mimeType: mimeType,
                size: fileBuffer ? fileBuffer.length : 0,
                path: filePath,
                fullPath: `${bucketToUse}/${filePath}`,
                storage_path: publicUrl, // We return the R2 public URL directly!
                uploadedAt: new Date()
            };
        } catch (error) {
            console.error("❌ StorageService.uploadDocument Error:", error.message);
            throw new Error(`Failed to upload document: ${error.message}`);
        }
    }

    /**
     * Generate a temporary signed URL for viewing private documents
     * Backward compatible: New R2 files have full URLs, old Supabase files have relative paths.
     * @param {string} path - Path within the bucket or full URL
     * @param {number} expiresIn - Expiry in seconds (default 1 hour)
     */
    async getSignedUrl(path, expiresIn = 3600) {
        try {
            // If it's already a full HTTP url (New R2 format), return it directly.
            if (path && path.startsWith('http')) return path;
            
            // If it's a relative path, it's an OLD file still living in Supabase!
            // We must generate a Supabase signed URL so old files don't break.
            const { data, error } = await primarySupabaseClient.storage
                .from(this.bucket)
                .createSignedUrl(path, expiresIn);

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error("❌ StorageService.getSignedUrl Error:", error.message);
            return null;
        }
    }

    /**
     * Delete a file from storage
     * @param {string} path 
     */
    async deleteDocument(path) {
        try {
            const { deleteFromR2 } = await import("../config/r2Client.js");
            await deleteFromR2(path);
            return true;
        } catch (error) {
            console.error("❌ StorageService.deleteDocument Error:", error.message);
            return false;
        }
    }
}

export default new StorageService();
