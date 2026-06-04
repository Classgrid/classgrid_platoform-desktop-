import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Use ENCRYPTION_KEY if available, fallback to JWT_SECRET (must be exactly 32 chars for aes-256)
// We hash the secret to ensure it's exactly 32 bytes, regardless of what's in the env file.
const rawSecret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "dev_secret";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(String(rawSecret)).digest("base64").substring(0, 32);

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a plain text string using AES-256-CBC.
 * @param {string} text - The clear text to encrypt.
 * @returns {string} - The IV and encrypted text joined by a colon (iv:encrypted).
 */
export function encrypt(text) {
    if (!text) return text;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypts an AES-256-CBC encrypted string.
 * @param {string} text - The encrypted string (iv:encrypted format).
 * @returns {string} - The decrypted clear text.
 */
export function decrypt(text) {
    if (!text) return text;
    
    const textParts = text.split(":");
    if (textParts.length !== 2) return text; // Probably not encrypted, return as is (legacy support/cleartext)
    
    try {
        const iv = Buffer.from(textParts[0], "hex");
        const encryptedText = Buffer.from(textParts[1], "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (error) {
        console.error("[Encryption Error]: Failed to decrypt text.", error.message);
        return null;
    }
}
