import fetch from 'node-fetch';

const DMP_CHAT_SYSTEM_PROMPT = `You are the Design Prompt Assistant for an AI-powered content generation platform.
Your task is to help users refine their "Design Mega Prompt" (DMP), which is used to generate images.

Current Design Mega Prompt:
{{CURRENT_DMP}}

Guidelines:
1. Conversational Refinement: When a user asks for a change (e.g., "Change the text to 'Join Now'", "Make the background more vibrant", or "Remove the group of people"), you must update the Design Mega Prompt accordingly.
2. Format Preservation: The Design Mega Prompt follows a specific structure:
   MEGAPROMPT: [The detailed visual description and instructions]
   NEGATIVE: [Negative prompts/what to avoid]
   You MUST maintain this MEGAPROMPT/NEGATIVE structure in your output.
3. Full Content Persistence: You MUST provide the FULL, UPDATED Design Mega Prompt. Do NOT just provide the snippet of what changed. Incorporate the user's request into the existing prompt to ensure all other specific design details are preserved.
4. Structured Output: You MUST ALWAYS return a JSON response with the following format:
{
  "response": "Your natural language response to the user here. Summarize what you changed.",
  "updatedDmp": "The FULL updated Design Mega Prompt including MEGAPROMPT and NEGATIVE sections."
}
5. Helpfulness: Be polite and professional. Explain what you changed based on their request.
`;

export async function processDmpChat({ currentDmp, message }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { ok: false, error: 'Missing OPENAI_API_KEY' };
    }

    const systemPrompt = DMP_CHAT_SYSTEM_PROMPT.replace('{{CURRENT_DMP}}', currentDmp || 'No prompt set yet.');

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
            updatedDmp: content.updatedDmp
        };
    } catch (error) {
        console.error('DMP Chat Service Error:', error);
        return { ok: false, error: 'Failed to process DMP chat' };
    }
}
