import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_KEY || process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * analyzeProctorSnapshot
 * Analyzes an image snapshot for potential cheating violations.
 * @param {string} base64Image - The image in base64 format.
 * @returns {Promise<Object>} { violationDetected: boolean, reason: string }
 */
export const analyzeProctorSnapshot = async (base64Image) => {
    try {
        if (!base64Image) throw new Error("No image provided");

        // Prepare the image for Gemini
        const imagePart = {
            inlineData: {
                data: base64Image.split(",")[1] || base64Image,
                mimeType: "image/jpeg",
            },
        };

        const prompt = `
            You are an AI Exam Proctor. Analyze this webcam snapshot of a student taking a high-stakes exam.
            Check for the following violations:
            1. More than one person in frame.
            2. No person in frame (empty seat).
            3. Use of mobile phone or electronic devices.
            4. Student talking or wearing headphones (if visible).
            5. Student looking away from the screen persistently.

            Response MUST be a JSON object:
            {
                "violationDetected": boolean,
                "reason": "string describing the violation or 'None'",
                "confidence": number (0-1)
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        // Clean and parse JSON
        const jsonMatch = text.match(/\{.*\}/s);
        if (!jsonMatch) throw new Error("Invalid AI response format");
        
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.error("[Proctor Service] Analysis Error:", err);
        return { violationDetected: false, reason: "Analysis failed", error: err.message };
    }
};
