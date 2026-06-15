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
     * Upload a file to Supabase Storage
     * @param {Buffer} fileBuffer - The file content
     * @param {string} fileName - Original file name
     * @param {string} mimeType - File MIME type
     * @param {string} folderPath - Path within bucket (e.g. "org_id/app_id")
     * @returns {Promise<Object>} { url, path, fullPath }
     */
    async uploadDocument(fileBuffer, fileName, mimeType, folderPath, targetBucket = null) {
        try {
            const fileExt = fileName.split('.').pop();
            const uniqueFileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${folderPath}/${uniqueFileName}`;
            const bucketToUse = targetBucket || this.bucket;

            const { data, error } = await primarySupabaseClient.storage
                .from(bucketToUse)
                .upload(filePath, fileBuffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (error) throw error;

            return {
                path: data.path,
                fullPath: `${bucketToUse}/${data.path}`,
                // In production, we should probably generate signed URLs on demand
                // for security, rather than storing public ones.
                // But for now, we'll return the relative path.
                storage_path: data.path
            };
        } catch (error) {
            console.error("❌ StorageService.uploadDocument Error:", error.message);
            throw new Error(`Failed to upload document: ${error.message}`);
        }
    }

    /**
     * Generate a temporary signed URL for viewing private documents
     * @param {string} path - Path within the bucket
     * @param {number} expiresIn - Expiry in seconds (default 1 hour)
     */
    async getSignedUrl(path, expiresIn = 3600) {
        try {
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
            const { error } = await primarySupabaseClient.storage
                .from(this.bucket)
                .remove([path]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("❌ StorageService.deleteDocument Error:", error.message);
            return false;
        }
    }
}

export default new StorageService();
