import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Memory storage (best for direct uploads to S3/Cloudinary/etc)
const memoryStorage = multer.memoryStorage();

// Global Multer configuration with strict 5MB limit
export const upload = multer({
    storage: memoryStorage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        fieldSize: 20 * 1024 * 1024 // 20MB limit for text fields (allows multiple large base64 images in rich text)
    }
});

// For specific single files
export const singleUpload = (fieldName) => upload.single(fieldName);

// For multiple files
export const multipleUploads = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

export default upload;
