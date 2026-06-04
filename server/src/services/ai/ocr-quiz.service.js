import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_KEY);

/**
 * Extracts questions from an image using Gemini 1.5 Flash
 * Supports Physics, Maths, Chemistry (LaTeX) and General subjects
 */
export async function extractQuestionsFromImage(imageBuffer, mimeType) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an expert OCR and Question Parser for Classgrid Platform.
        Your task is to extract educational questions from the provided image (which could be a photo of a textbook, a PDF screenshot, or a handwritten paper).

        RULES:
        1. Extract the question text, options, and identify the correct answer if possible.
        2. Format Maths/Physics equations using LaTeX (wrap in $ for inline).
        3. Since you are outputting JSON, double-escape all backslashes in LaTeX (e.g., \\\\frac instead of \\frac).
        4. If options are not clear, generate 4 plausible options based on the question.
        5. Return exactly a JSON object with a "questions" array.

        OUTPUT FORMAT:
        {
          "questions": [
            {
              "question": "The question text here...",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer": "Option A",
              "type": "mcq",
              "marks": 4
            }
          ]
        }
        `;

        const imageParts = [
            {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType
                },
            },
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();
        
        // Clean markdown JSON blocks if present
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error("Invalid format returned by AI");
        }

        return parsed.questions;
    } catch (error) {
        console.error("[AI OCR Service] Error:", error);
        throw new Error("AI failed to read questions from this image.");
    }
}
