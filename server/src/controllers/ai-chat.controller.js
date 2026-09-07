import { createLLMClient } from "@classgrid/ai/core";
// The system prompt was originally in ./prompt, we will define it here or import it if needed.
const SYSTEM_PROMPT = `You are the Classgrid AI Assistant. 

IMPORTANT FORMATTING RULES:
When creating markdown tables, you MUST use html line breaks (<br>) inside table cells if the text is long. This prevents the table from becoming excessively wide and forcing the user to scroll horizontally. 
CRITICAL: ONLY use <br> tags INSIDE table cells. Do NOT use <br> tags anywhere else in your response.`;

export const streamAskAi = async (req, res) => {
    // 1. Setup Server-Sent Events (SSE) headers for Express
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    try {
        const body = req.body || {};
        
        // 2. Construct messages
        const messages = body.history || [];
        if (body.question) {
            messages.push({ role: "user", content: body.question });
        }
        messages.unshift({ role: "system", content: SYSTEM_PROMPT });

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

        if (!answer) {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "Failed to get an answer from the AI." })}\n\n`);
        } else if (answer === "[RATE_LIMITED]") {
            res.write(`data: ${JSON.stringify({ type: "answer", answer: "I'm currently experiencing high traffic and cannot process your request right now." })}\n\n`);
        } else {
            res.write(`data: ${JSON.stringify({ type: "answer", answer })}\n\n`);
        }

    } catch (err) {
        console.error("API Route Error:", err);
        res.write(`data: ${JSON.stringify({ type: "answer", answer: "An error occurred while calling the AI." })}\n\n`);
    } finally {
        res.end();
    }
};

// Trigger redeploy for env update
// GitHub Action Force Trigger
