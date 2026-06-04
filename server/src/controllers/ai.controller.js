import { generateEmbedding, chunkText } from "../services/ai/embeddings.service.js";
import { primarySupabaseClient } from "../config/supabaseClient.js";
import pdf from "pdf-parse";
import axios from "axios";
import OpenAI from "openai";
import { generateStudentPersona } from "../services/ai/persona.service.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * indexMaterial
 * Parses a material (PDF/Text) and stores its chunks in Supabase Vector DB.
 */
export const indexMaterial = async (req, res) => {
    try {
        const { materialId, fileUrl, type } = req.body;
        const orgId = req.user.organization_id.toString();

        if (!fileUrl) return res.status(400).json({ message: "fileUrl is required" });

        let text = "";

        // 1. Extract Text
        if (type === "pdf" || fileUrl.endsWith(".pdf")) {
            const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
            const data = await pdf(response.data);
            text = data.text;
        } else {
            const response = await axios.get(fileUrl);
            text = response.data;
        }

        if (!text) throw new Error("Could not extract text from document");

        // 2. Chunk Text
        const chunks = chunkText(text, 1000, 200);

        // 3. Generate Embeddings & Insert to Supabase
        const insertPromises = chunks.map(async (chunk) => {
            const embedding = await generateEmbedding(chunk);
            return {
                material_id: materialId,
                org_id: orgId,
                content: chunk,
                embedding: embedding,
                metadata: { source: fileUrl, indexedAt: new Date() }
            };
        });

        const vectors = await Promise.all(insertPromises);

        const { error } = await primarySupabaseClient
            .from("syllabus_vectors")
            .insert(vectors);

        if (error) throw error;

        res.json({ message: "Material indexed successfully", chunks: chunks.length });
    } catch (err) {
        console.error("[AI Controller] Index error:", err);
        res.status(500).json({ message: "Indexing failed", error: err.message });
    }
};

/**
 * chatWithSyllabus
 * Performs RAG search and answers user queries based on syllabus context.
 */
export const chatWithSyllabus = async (req, res) => {
    try {
        const { query, classroomId } = req.body;
        const orgId = req.user.organization_id.toString();

        if (!query) return res.status(400).json({ message: "Query is required" });

        // 1. Embed Query
        const queryEmbedding = await generateEmbedding(query);

        // 2. Vector Search in Supabase
        const { data: chunks, error } = await primarySupabaseClient.rpc("match_syllabus_chunks", {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_org_id: orgId
        });

        if (error) throw error;

        // 3. Augment Prompt with Context
        const contextText = chunks.map(c => c.content).join("\n---\n");
        const systemPrompt = `You are a helpful AI study assistant on Classgrid. 
Answer the user's question using ONLY the provided syllabus context below. 
If the answer is not in the context, say "I don't have enough syllabus information on that yet."
Be concise and strictly academic.

CONTEXT:
${contextText}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast and powerful enough for RAG
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            temperature: 0
        });

        res.json({ 
            answer: completion.choices[0].message.content,
            sources: chunks.map(c => ({ id: c.id, similarity: c.similarity }))
        });

    } catch (err) {
        console.error("[AI Controller] Chat error:", err);
        res.status(500).json({ message: "AI chat failed", error: err.message });
    }
};

/**
 * getMyPersona
 * Returns personalized academic insights for the logged-in student.
 */
export const getMyPersona = async (req, res) => {
    try {
        const studentId = req.user._id;
        const orgId = req.user.organization_id;

        const persona = await generateStudentPersona(studentId, orgId);
        res.json(persona);
    } catch (err) {
        console.error("[AI Controller] Persona error:", err);
        res.status(500).json({ message: "Failed to generate persona" });
    }
};
