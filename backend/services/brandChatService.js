/**
 * Brand Chat Service
 * Handles AI-driven refinements to the Brand Core (brandPack, brandCapability, writerAgent, etc.)
 */
export const processBrandChat = async ({ currentBrandData, message, history = [] }) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { ok: false, error: "Missing OPENAI_API_KEY" };
        }

        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

        const systemPrompt = `
You are an expert Brand Strategist and AI Prompt Engineer.
Your goal is to help the user refine their Brand Core settings by interpreting their natural language descriptions.

CURRENT BRAND DATA:
---
BRAND PACK: 
${currentBrandData.brandPack || "Not set"}

BRAND CAPABILITIES:
${currentBrandData.brandCapability || "Not set"}

WRITER SYSTEM PROMPT:
${currentBrandData.writerAgent || "Not set"}

REVIEWER SYSTEM PROMPT:
${currentBrandData.reviewPrompt1 || "Not set"}

VISUAL IDENTITY / IMAGE RULES:
${currentBrandData.systemInstruction || "Not set"}

EMOJI RULE:
${currentBrandData.emojiRule || "Not set"}
---

TASK:
1. Analyze the user's request. 
2. Determine which fields in the Brand Core need refinement (it could be one, multiple, or all).
3. Provide the FULL, UPDATED content for each affected field. 
4. Provide a brief, professional response explaining what you changed and why.

STRICT OUTPUT FORMAT (JSON ONLY):
{
  "response": "Your professional explanation to the user",
  "updatedFields": {
    "brandPack": "string or null if unchanged",
    "brandCapability": "string or null if unchanged",
    "writerAgent": "string or null if unchanged",
    "reviewPrompt1": "string or null if unchanged",
    "systemInstruction": "string or null if unchanged",
    "emojiRule": "string or null if unchanged"
  }
}

STRICT RULES:
- IMPORTANT: When a field is affected, YOU MUST return its COMPLETE new content. DO NOT return just the changes or a summary. You must incorporate the user's request into the existing data and return the whole strategic document for that field.
- If a field is not affected by the user's request, set it to null in the "updatedFields" object.
- Maintain the professional, high-authority tone of the existing documents.
- Keep the structure (Markdown headings, bullets) of the existing documents unless asked to change it.
- Ensure the result is valid JSON.
`;

        const historyMessages = history.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        })).slice(-10);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...historyMessages,
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenAI error: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);

        return {
            ok: true,
            response: content.response,
            updatedFields: content.updatedFields
        };

    } catch (err) {
        console.error("Brand Chat Service Error:", err);
        return { ok: false, error: err.message };
    }
};
