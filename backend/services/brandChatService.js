import fetch from 'node-fetch';

const BRAND_CHAT_SYSTEM_PROMPT = `You are the Brand Intelligence Assistant for an AI-powered content generation platform.
Your task is to help users manage their "Brand Core" (Identity, Facts, Writing Rules, and Visual Rules).

Current Brand Core data:
{{BRAND_CORE_JSON}}

Guidelines:
1. Helpfulness: Answer questions about the brand core and explain what each section does.
2. Conversational Updates: When a user asks to change or update something (e.g., "Change our writing style to be more professional" or "Our primary colors are blue and white"), you must propose the specific updates to the Brand Core fields.
3. Full Content Persistence: If you are updating a field, you MUST provide the FULL, UPDATED content for that field. Do NOT just provide the new snippet or a summary of the change. You must incorporate the user's request into the existing content of that field (found in the JSON above) to ensure no existing information is lost unless explicitly requested by the user.
4. Structured Output: You MUST ALWAYS return a JSON response with the following format:
{
  "response": "Your natural language response to the user here. Summarize what you changed.",
  "updates": {
    "brandPack": "FULL updated text or null",
    "brandCapability": "FULL updated text or null",
    "writerAgent": "FULL updated text or null",
    "reviewPrompt1": "FULL updated text or null",
    "systemInstruction": "FULL updated text or null",
    "emojiRule": "FULL updated text or null"
  }
}
- Set fields in "updates" ONLY if they need to change based on the user's request. 
- If no update is needed, set the field to null or keep the "updates" object empty.
- "systemInstruction" maps to "Visual & Image Rules".
- Always be polite and professional.
- If the user's request is vague, ask for clarification in the "response" and keep "updates" empty.
`;

export async function processBrandChat({ brandKB, message }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { ok: false, error: 'Missing OPENAI_API_KEY' };
    }

    const brandCoreJson = JSON.stringify({
        brandPack: brandKB.brandPack,
        brandCapability: brandKB.brandCapability,
        writerAgent: brandKB.writerAgent,
        reviewPrompt1: brandKB.reviewPrompt1,
        systemInstruction: brandKB.systemInstruction,
        emojiRule: brandKB.emojiRule
    }, null, 2);

    const systemPrompt = BRAND_CHAT_SYSTEM_PROMPT.replace('{{BRAND_CORE_JSON}}', brandCoreJson);

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            return { ok: false, error: `LLM Error: ${res.status} - ${errorText}` };
        }

        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);

        return {
            ok: true,
            response: content.response,
            updates: content.updates || {}
        };
    } catch (error) {
        console.error('Brand Chat Service Error:', error);
        return { ok: false, error: 'Failed to process brand chat' };
    }
}
