import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * transcribeAudio
 * Converts audio file to text using Groq Whisper Large v3
 */
export const transcribeAudio = async (buffer, originalName) => {
    try {
        // Groq SDK requires a file object or a path. Since we are in memory,
        // we'll write to a temporary file in the workspace scratch directory.
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const tempPath = path.join(tempDir, `${Date.now()}_${originalName}`);
        fs.writeFileSync(tempPath, buffer);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: "whisper-large-v3",
            response_format: "json",
            language: "en" // Optional: can be set to "auto"
        });

        // Cleanup
        fs.unlinkSync(tempPath);

        return transcription.text;
    } catch (err) {
        console.error("[Voice Service] Transcription Error:", err);
        throw new Error(`Transcription failed: ${err.message}`);
    }
};
