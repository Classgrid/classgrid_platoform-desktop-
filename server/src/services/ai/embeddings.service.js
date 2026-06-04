import OpenAI from 'openai';
import "../../../env.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * generateEmbedding
 * Converts a text chunk into a 1536-dimensional vector.
 * Model: text-embedding-3-small
 */
export const generateEmbedding = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, ' '), // Clean up newlines for better embedding quality
            encoding_format: "float",
        });
        return response.data[0].embedding;
    } catch (err) {
        console.error("[AI Embedding] Error:", err);
        throw new Error(`Failed to generate embedding: ${err.message}`);
    }
};

/**
 * chunkText
 * Splits long text into smaller chunks with overlap for better RAG context.
 */
export const chunkText = (text, maxLength = 1000, overlap = 200) => {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = start + maxLength;
        chunks.push(text.slice(start, end));
        start = end - overlap; // Move back by overlap to preserve context
    }

    return chunks;
};
