import { createLLMClient } from "@classgrid/ai/core";
import { getPresignedUploadUrl } from "../config/r2Client.js";
import {
    createSession, 
    saveMessage, 
    getSessions, 
    getSessionMessages,
    updateSessionTitle
} from "../services/ai-chat.service.js";
// The system prompt was originally in ./prompt, we will define it here or import it if needed.
const SYSTEM_PROMPT = `You are the Classgrid AI Assistant. 

IMPORTANT FORMATTING RULES:
When creating markdown tables, you MUST use html line breaks (<br>) inside table cells if the text is long. This prevents the table from becoming excessively wide and forcing the user to scroll horizontally. 
CRITICAL: ONLY use <br> tags INSIDE table cells. Do NOT use <br> tags anywhere else in your response.`;

async function generateSessionTitle(sessionId, question) {
    try {
        const client = createLLMClient({
            providers: [
                {
                    name: "gemini",
                    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
                    apiKey: process.env.GEMINI_API_KEY || "",
                    model: "gemini-3.5-flash"
                },
                {
                    name: "groq",
                    url: "https://api.groq.com/openai/v1/chat/completions",
                    apiKey: process.env.GROQ_API_KEY || "",
                    model: "gpt-oss-20b"
                }
            ]
        });
        const answer = await client.generate({
            messages: [
                { role: "system", content: "You are a title generator. Generate a very short 3-5 word title for the user's message. Output ONLY the raw words, without quotes or punctuation." },
                { role: "user", content: question }
            ]
        });
        if (answer && !answer.includes("[RATE_LIMITED]")) {
            const cleanTitle = answer.trim().replace(/^["']|["']$/g, '');
            if (cleanTitle.length > 0) {
                await updateSessionTitle(sessionId, cleanTitle);
            }
        }
    } catch (err) {
        console.error("Error generating session title:", err);
    }
}

export const streamAskAi = async (req, res) => {
    // 1. Setup Server-Sent Events (SSE) headers for Express
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    try {
        const body = req.body || {};
        
        const messages = body.history || [];
        
        let sessionId = body.sessionId;
        const isIncognito = body.isIncognito || false;
        
        // 2a. If not incognito and no session exists, create one
        if (!isIncognito && !sessionId && body.question) {
            const title = body.question.length > 50 ? body.question.substring(0, 47) + "..." : body.question;
            const session = await createSession(body.userEmail || 'unknown@classgrid.in', title, false);
            if (session) {
                sessionId = session.id;
                // Generate a real title in the background
                if (body.question.length > 10) {
                    generateSessionTitle(sessionId, body.question).catch(console.error);
                }
            }
        }

        // 2b. If not incognito, save the user message to DB immediately
        if (!isIncognito && sessionId && body.question) {
            await saveMessage(sessionId, "user", body.question, body.fileUrls || []);
        }

        if (body.question) {
            // Include image URLs in the SDK's expected format if needed
            // Currently, simple string content is supported by the AI core, but if they had fileUrls, we append them as context.
            let content = body.question;
            if (body.fileUrls && body.fileUrls.length > 0) {
                content += "\n\nAttached Files:\n" + body.fileUrls.join('\n');
            }
            messages.push({ role: "user", content });
        }
        
        let dynamicSystemPrompt = SYSTEM_PROMPT;
        if (body.userName || body.userEmail || body.userRole || body.subdomain) {
            dynamicSystemPrompt += `\n\n--- USER CONTEXT ---\nYou are currently speaking to ${body.userName || "a user"}.`;
            if (body.userEmail) {
                dynamicSystemPrompt += `\nTheir Email: ${body.userEmail}`;
                if (body.userEmail.endsWith("@classgrid.in")) {
                    dynamicSystemPrompt += ` (SUPER ADMIN / PLATFORM OWNER)`;
                }
            }
            if (body.userRole) dynamicSystemPrompt += `\nTheir Role: ${body.userRole}`;
            if (body.subdomain) {
                dynamicSystemPrompt += `\nCurrent Dashboard Subdomain: ${body.subdomain}`;
                if (body.subdomain !== "classgrid.in" && body.subdomain !== "superadmin.classgrid.in" && body.subdomain !== "localhost") {
                    dynamicSystemPrompt += ` (This means they are using a school/organization's dashboard, not the super admin dashboard)`;
                }
            }
        }
        
        messages.unshift({ role: "system", content: dynamicSystemPrompt });

        // 3. Initialize the real LLM Client from the Classgrid SDK using the fallback hierarchy
        const client = createLLMClient({
            providers: [
                {
                    name: "gemini",
                    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
                    apiKey: process.env.GEMINI_API_KEY || "",
                    model: "gemini-3.5-flash"
                },
                {
                    name: "groq",
                    url: "https://api.groq.com/openai/v1/chat/completions",
                    apiKey: process.env.GROQ_API_KEY || "",
                    model: "gpt-oss-20b"
                },
                {
                    name: "mistral",
                    url: "https://api.mistral.ai/v1/chat/completions",
                    apiKey: process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY_2 || "",
                    model: "open-mistral-nemo"
                }
            ],
            verbose: true,
            maxToolDepth: 5,
            defaultMaxTokens: 2000,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "search_web",
                        description: "Search the live web for competitor analysis, news, or external facts.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "The search query (e.g. 'Teachmint features and pricing')" }
                            },
                            required: ["query"]
                        }
                    }
                }
            ],
            toolHandlers: {
                search_web: async (args) => {
                    const tavilyKey = process.env.TAVILY_API_KEY?.trim();
                    if (!tavilyKey) return "Search failed because TAVILY_API_KEY is missing.";
                    try {
                        const tavilyRes = await fetch("https://api.tavily.com/search", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                api_key: tavilyKey,
                                query: args.query,
                                search_depth: "basic",
                                include_answer: true,
                                max_results: 5
                            })
                        });
                        const searchData = await tavilyRes.json();
                        if (searchData.answer) {
                            const sourceUrls = (searchData.results || []).map(r => `- ${r.title}: ${r.url}`).join('\n');
                            return `${searchData.answer}\n\nSource URLs:\n${sourceUrls}`;
                        } else if (searchData.results && searchData.results.length > 0) {
                            return searchData.results.map(r => `${r.title} (${r.url})\n${r.content}`).join('\n\n');
                        } else {
                            return "No search results found.";
                        }
                    } catch (e) {
                        return "Web Search failed: " + e;
                    }
                }
            }
        });

        // 4. Run the Client and pass SSE writes inside the callbacks
        const answer = await client.generate({
            messages,
            onStatus: (status) => {
                const mappedLabel = status === "search web" ? "searching" : status;
                res.write(`data: ${JSON.stringify({ type: "status", label: mappedLabel })}\n\n`);
            },
            onThought: (thought) => {
                res.write(`data: ${JSON.stringify({ type: "thought", thought })}\n\n`);
            }
        });

        // 5. Send back the sessionId if it was created
        if (sessionId) {
            res.write(`data: ${JSON.stringify({ type: "session_info", sessionId })}\n\n`);
        }

        if (!answer) {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "Failed to get an answer from the AI." })}\n\n`);
        } else if (answer === "[RATE_LIMITED]") {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "I'm currently experiencing high traffic and cannot process your request right now." })}\n\n`);
        } else {
            // Save Assistant response
            if (!isIncognito && sessionId) {
                await saveMessage(sessionId, "assistant", answer, []);
            }
            res.write(`data: ${JSON.stringify({ type: "answer", answer })}\n\n`);
        }

    } catch (err) {
        console.error("API Route Error:", err);
        res.write(`data: ${JSON.stringify({ type: "answer", answer: "An error occurred while calling the AI." })}\n\n`);
    } finally {
        res.end();
    }
};

export const getChatSessions = async (req, res) => {
    try {
        const email = req.user?.email; // Assumes isAuthenticated populates req.user
        if (!email) return res.status(401).json({ error: "Unauthorized" });

        const sessions = await getSessions(email);
        res.json({ sessions });
    } catch (e) {
        console.error("Error getting sessions:", e);
        res.status(500).json({ error: "Failed to load chat sessions" });
    }
};

export const getChatSessionMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await getSessionMessages(id);
        res.json({ messages });
    } catch (e) {
        console.error("Error getting session messages:", e);
        res.status(500).json({ error: "Failed to load messages" });
    }
};

export const uploadChatImage = async (req, res) => {
    try {
        const { fileName, mimeType } = req.body;
        if (!fileName || !mimeType) {
            return res.status(400).json({ error: "fileName and mimeType required" });
        }
        
        // Use R2 presigned URL generator for secure direct browser upload
        const result = await getPresignedUploadUrl(fileName, mimeType, 3600, `ai-chat-uploads/${Date.now()}-${fileName}`);
        res.json(result);
    } catch (e) {
        console.error("Error generating presigned URL for AI chat:", e);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
};
