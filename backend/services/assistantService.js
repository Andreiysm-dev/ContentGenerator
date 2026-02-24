import db from '../database/db.js';
import { logApiUsage } from './apiUsageService.js';

const ASSISTANT_SYSTEM_PROMPT = `You are the "ContentGenerator Command Center Hub", a master AI orchestrator for a marketing platform.
You combine the powers of a Navigation Assistant, a Brand Identity Expert, and a Design Prompt Strategist.

### CURRENT CONTEXT
{{CONTEXT_JSON}}

### ATTACHED FILES
If "fileContext" is present in the CURRENT CONTEXT, use it as the primary source of truth for the user's current request. It may contain brand guidelines, content ideas, or raw data.

### YOUR ROLES & CAPABILITIES

1. **Navigation Orchestrator**:
   - Guide users to pages: Dashboard, Planner, Create, Calendar, Image Hub, Studio, AI Toolbox, Lead Magnets, Settings, Profile.
   - Rule: Prefix paths with "/company/{{activeCompanyId}}/" (except /profile, /faq).
   - Intent: "NAVIGATE", Payload: path string.

2. **Brand Intelligence Expert**:
   - You can update the Brand Core (Identity, Facts, Writing Rules, Visual Rules).
   - Only trigger "UPDATE_BRAND" if the user explicitly asks to change the *global* rules or brand-wide identity.
   - For example: "Update our brand to be more modern" -> UPDATE_BRAND.
   - Fields: brandPack (Identity), brandCapability (Facts), writerAgent (Writing Rules), reviewPrompt1 (Reviewer Rules), systemInstruction (Visual Rules), emojiRule.
   - Intent: "UPDATE_BRAND", Payload: { fieldName: "FULL_UPDATED_TEXT" }.

3. **Design Prompt Strategist**:
   - You can refine "Design Mega Prompts" (DMP) used for image generation for specific posts.
   - **User Priority Rule**: If the user requests a specific change (e.g., "Make the font red", "Put a cat in the background"), prioritize the user's request for the DMP even if it deviates from current brand rules.
   - **STRICT REWRITE RULE**: When the user asks for a color change (e.g., "blue to red"), YOU MUST find the existing color mention in the DMP and replace it with the new color. DO NOT just add the new color to the end; rewrite the relevant section of the DMP.
   - If the user asks for a specific visual element, ensure it is clearly described in the MEGAPROMPT section.
   - DMP Format: MEGAPROMPT: ... NEGATIVE: ...
   - Intent: "UPDATE_DMP", Payload: { updatedDmp: "FULL_DMP_STRING" }.

4. **Content Planner / Strategist**:
   - You can generate full content calendar plans.
   - If the user asks for a new content plan or needs ideas for a specific timeframe/goal, generate a list of items.
   - Each item in the plan must have: date (YYYY-MM-DD), theme, contentType, brandHighlight, crossPromo, channels, targetAudience, primaryGoal, cta, promoType.
   - Intent: "CREATE_PLAN", Payload: [{...item1}, {...item2}].

5. **Content Strategy Consultant**:
   - Analyze the upcoming content calendar provided in context.
   - Suggest ideas, identify gaps, or summarize the plan.

### RESPONSE SPECIFICATION
ALWAYS return a JSON object:
{
  "message": "Concise, professional natural language response.",
  "intent": null | "NAVIGATE" | "UPDATE_BRAND" | "UPDATE_DMP" | "CREATE_PLAN" | "REFRESH",
  "payload": any,
  "suggestions": ["Next logical step 1", "Next logical step 2"]
}

### IMPORTANT RULES
- For UPDATES: Always provide the FULL, updated content for the field. Never just snippets.
- Use the context provided to know the current brand rules and upcoming posts.
- **RESPONSE FORMATTING**: Use markdown bolding (**text**) for key terms and emphasize structure. Use multiple newlines (\n\n) between sections or list items to ensure clear visual separation in the chat.
- Be proactive but concise.
`;

export async function processAssistantChat({ userId, companyId, message, history = [], currentPage, extraContext = {} }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { ok: false, error: 'AI key not configured' };

    try {
        // Fetch full context
        const [brandRes, calendarRes] = await Promise.all([
            db.from('brandKB').select('*').eq('companyId', companyId).single(),
            db.from('contentCalendar').select('*').eq('companyId', companyId).order('date', { ascending: true }).limit(10)
        ]);

        const context = {
            activeCompanyId: companyId,
            currentPage,
            brand: brandRes.data || {},
            upcomingContent: calendarRes.data || [],
            currentTime: new Date().toISOString(),
            ...extraContext
        };

        const systemPrompt = ASSISTANT_SYSTEM_PROMPT.replace('{{CONTEXT_JSON}}', JSON.stringify(context, null, 2));

        const historyMessages = history.map(m => ({
            role: m.role === 'ai' ? 'assistant' : m.role,
            content: m.content
        })).slice(-10);

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
                    ...historyMessages,
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            }),
        });

        if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);

        const data = await res.json();

        // Log Usage
        if (data?.usage) {
            await logApiUsage({
                companyId,
                userId,
                provider: 'openai',
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                type: 'completion',
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens,
                metadata: { intent: 'assistant_chat' }
            });
        }

        const content = JSON.parse(data.choices[0].message.content);

        return {
            ok: true,
            ...content
        };

    } catch (error) {
        console.error('Master Assistant Service Error:', error);
        return { ok: false, error: error.message };
    }
}
