import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are the Classgrid AI Assistant. Help the user with their questions.`;

export const streamAskAi = async (req, res) => {
    // 1. Setup Server-Sent Events (SSE) headers for Express
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    try {
        const body = req.body || {};
        const question = body.question || "";
        
        if (!process.env.AI_API_KEY) {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "AI API Key is not configured." })}\n\n`);
            return res.end();
        }

        res.write(`data: ${JSON.stringify({ type: "status", label: "thinking" })}\n\n`);

        const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: SYSTEM_PROMPT });

        const result = await model.generateContentStream(question);

        let fullText = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            // You can stream chunks if the client supports it, but for now we just build the answer
        }

        res.write(`data: ${JSON.stringify({ type: "answer", answer: fullText })}\n\n`);

    } catch (err) {
        console.error("API Route Error:", err);
        res.write(`data: ${JSON.stringify({ type: "answer", answer: "An error occurred while calling the AI." })}\n\n`);
    } finally {
        res.end();
    }
};
