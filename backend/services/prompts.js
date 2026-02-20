/**
 * Centralized prompts for the Content Generator system.
 * Edit these strings to refine the AI's behavior across different modules.
 */

// --- CAPTION GENERATION PROMPTS ---

/**
 * The template for the user prompt used during initial caption generation.
 * Placeholders like {{Brand Highlight}}, {{Theme}}, etc. are replaced at runtime.
 */
export const CAPTION_USER_PROMPT_TEMPLATE = [
    'Use the following inputs to generate ONE social caption. All inputs are authoritative.',
    '',
    'INPUTS',
    'Brand Highlight (80%): {{brandHighlight}}',
    'Cross-Promo (20%): {{crossPromo}}',
    'Theme: {{theme}}',
    'Content Type: {{contentType}}',
    'Channel(s): {{channels}}',
    'Target Audience: {{targetAudience}}',
    'Primary Goal: {{primaryGoal}}',
    'CTA (if provided): {{cta}}',
    'Type of Promotion: {{promoType}}',
    'Emoji Rule: {{emojiRule}}',
    'Brand Pack: {{brandPack}}',
    'Brand Capability Map: {{brandCapability}}',
    '',
    'EXECUTION RULES (NON-NEGOTIABLE)',
    '- Adapt tone and length to the listed Channel(s).',
    '- Speak directly to the Target Audience.',
    '- Deliver clear value BEFORE any promotion.',
    '- Maintain ecosystem framing:',
    '  - Brand Highlight is the primary focus.',
    '  - Cross-Promo is secondary and optional.',
    '- If CTA is missing, empty, or "", choose the most appropriate CTA based on Brand Pack and Capability Map.',
    '- If CTA is provided (non-empty), the returned JSON "cta" MUST match it exactly (verbatim, character-for-character). Do NOT paraphrase, shorten, expand, translate, or replace it.',
    '- Hashtags must be relevant, minimal (3–8), and professional.',
    '- Emoji Rule must be followed exactly.',
    '- Do NOT use markdown (**bold**, headings, bullets).',
    '- Do NOT add labels like “Context”, “Overview”, or explanations.',
    '- The caption MUST always end with the specified or chosen CTA as its final sentence or paragraph.',
    '',
    'FORMATTING RULES (CRITICAL)',
    '- The caption MAY contain multiple paragraphs.',
    '- Paragraphs must be separated by a single blank line.',
    '- Do NOT insert extra section titles or prefixes inside the caption.',
    '',
    'OUTPUT FORMAT (STRICT — MUST MATCH EXACTLY)',
    'Return STRICT JSON only (no markdown, no prose).',
    'Required JSON format:',
    '{',
    '  "framework": "EDUCATIONAL | PSA | STORY | CHECKLIST | PROBLEM-SOLUTION | PROMO | COMMUNITY",',
    '  "caption": "string (may include multiple paragraphs separated by a single blank line)",',
    '  "cta": "short CTA text only",',
    '  "hashtags": ["#Tag1", "#Tag2"]',
    '}',
    '',
    'FORMAT CHECK',
    '- Do not add extra keys.',
    '- Do not wrap the JSON in markdown.',
    '- Ensure hashtags are returned as an array of 3 to 8 strings, each starting with #.',
].join('\n');


// --- CONTENT REVIEW PROMPTS ---

/**
 * The template for the user prompt used during content review/revision.
 */
export const REVIEW_USER_PROMPT_TEMPLATE = [
    'You are reviewing content',
    '',
    'Inputs',
    '',
    'Draft Caption:{{captionOutput}}',
    '',
    'Draft CTA:{{ctaOuput}}',
    '',
    'Draft Hashtags:{{hastagsOutput}}',
    '',
    'Channel:{{channels}}',
    '',
    'Primary Goal:{{primaryGoal}}',
    '',
    'Brand Pack:{{brandPack}}',
    '',
    'Capability Map:{{brandCapability}}',
    '',
    'Emoji Rule:{{emojiRule}}',
    '',
    'Instructions',
    '',
    'Review the draft for brand alignment, clarity, and compliance',
    'Simplify language where needed',
    'Remove or replace any forbidden words or risky claims',
    'Ensure tone matches the channel and audience',
    'Ensure emoji usage aligns with the Emoji Rule',
    'Fix the content directly if possible',
    'If you can fully correct the content to be compliant and on-brand, you MUST mark APPROVED even if you made changes.',
    'NEEDS REVISION is ONLY allowed when you require specific human input (missing facts, unclear offer details, legal/compliance uncertainty that cannot be safely removed).',
    'If you choose NEEDS REVISION, NOTES MUST include a bullet that starts with: HUMAN INPUT REQUIRED: <question(s) or missing info>',
    'If you mark NEEDS REVISION, you MUST still revise the content yourself and provide corrected final outputs.',
    'If you mark NEEDS REVISION, NOTES must include a clear list of the specific changes you made (what you changed and why).',
    'Only mark NEEDS REVISION if the content still has material issues that require human input even after your best corrections.',
    '- You MUST output the FINAL CAPTION, FINAL CTA, and FINAL HASHTAGS in full for every review. Even if you make zero changes, you must copy the draft versions into the final output sections.',
    '- Never leave the final sections empty or say "no changes" or "same as above".',
    '',
    '- Match the exact Draft CTA in your output if it was provided.',
    '- You MUST physically output the FINAL CAPTION, FINAL CTA, and FINAL HASHTAGS in every response. ',
    '- If you are satisfied with the original hashtags, you MUST still copy them into the FINAL HASHTAGS section. Never leave it empty.',
    '',
    'Additional CTA Rule (NON-NEGOTIABLE)',
    '- Every FINAL CAPTION must explicitly include the FINAL CTA as its closing call-to-action.',
    '- If the user-provided CTA ({{ctaOuput}}) is non-empty, FINAL CTA MUST match it exactly (verbatim, character-for-character). Do NOT paraphrase, shorten, expand, translate, or replace it.',
    '- Only if Draft CTA is missing/empty/null may you improve/select a CTA based on Brand Pack and Capability Map.',
    '',
    'Final Output Requirement',
    '',
    'Output must follow this structure exactly:',
    '',
    'DECISION: <APPROVED or NEEDS REVISION>',
    'NOTES:',
    '',
    '<bullet>',
    '<bullet>',
    '',
    'FINAL CAPTION:',
    '',
    '<caption>',
    '',
    'FINAL CTA:',
    '<cta>',
    '',
    'FINAL HASHTAGS:',
    '<hashtags>',
    '',
    'CRITICAL: You MUST output all three FINAL sections (CAPTION, CTA, HASHTAGS) even if no changes were made. AI laziness is forbidden. If sections are missing from draft, invent them based on brand rules.',
    'Do not include anything else.',
].join('\n');










// --- IMAGE GENERATION PROMPTS (BRAND-AGNOSTIC; WORKS FOR ANY COMPANY) ---

/**
 * Store this in: brandKB.imageSystemPrompt
 * "Prompt Engineer" outputs ONE Gemini-ready MEGAPROMPT + NEGATIVE.
 *
 * This prompt is intentionally general. All brand-specific visual decisions must come from:
 * {{brandKB.systemInstruction}}
 */
// More-detailed MEGAPROMPT generator so Gemini doesn't have to guess.
// Still brand-agnostic: all styling + template rules must come from {{brandKB.systemInstruction}}.

/**
 * Store this in: brandKB.imageSystemPrompt
 * "Prompt Engineer" outputs ONE Gemini-ready MEGAPROMPT + NEGATIVE.
 */
export const IMAGE_GENERATION_SYSTEM_PROMPT =
    'You are an expert prompt engineer and senior graphic designer specializing in production-ready text-to-image prompts for Gemini.\n\n' +
    'TASK:\n' +
    'Generate ONE (1) production-ready IMAGE MEGAPROMPT that will be sent directly to Gemini for image generation.\n' +
    'The prompt must be so specific that Gemini does not need to guess layout, styling, copy, hierarchy, or rendering.\n\n' +
    'BRAND SYSTEM INSTRUCTION (MANDATORY — OVERRIDES ALL OTHER RULES):\n' +
    '{{brandKB.systemInstruction}}\n\n' +
    'If there is any conflict between general rules and the brand system instruction, the brand system instruction wins.\n\n' +
    'GLOBAL NON-NEGOTIABLE RULES (ENFORCE FOR ALL BRANDS UNLESS BRAND SYSTEM EXPLICITLY OVERRIDES):\n' +
    '1) LOGO ZONE POLICY:\n' +
    '   - Always reserve a dedicated logo placement zone with safe margins.\n' +
    '   - The logo zone MUST be COMPLETELY EMPTY: do NOT render any logo, brandmark, wordmark, brand name, watermark, or the word "Logo".\n' +
    '   - Logo zone location must follow brand system instruction if specified; otherwise default to header top-right.\n' +
    '2) BRAND NAME POLICY:\n' +
    '   - Do NOT render the company/brand name anywhere in the image unless the brand system instruction explicitly ALLOWS or REQUIRES it.\n' +
    '3) CTA POLICY:\n' +
    '   - Include a CTA element inside the design.\n' +
    '   - If CTA text is provided, the CTA label MUST match it exactly, character-for-character. No quotes, no paraphrases, no additions.\n' +
    '   - If CTA text is missing/empty/null, ONLY THEN create a short generic CTA (1–2 words) consistent with the brand system.\n' +
    '4) SEMANTIC MATCH:\n' +
    '   - Imagery and composition must unmistakably reflect the caption meaning using a concrete scene, setting, objects, or a clear visual metaphor.\n' +
    '5) MOBILE READABILITY:\n' +
    '   - Strong hierarchy, high contrast, large text, safe margins, no text over busy areas or faces.\n\n' +
    'MEGAPROMPT MUST BE HIGHLY SPECIFIC (NOT VAGUE):\n' +
    'You must explicitly define:\n' +
    '- Canvas specs and safe zones\n' +
    '- Grid and spacing\n' +
    '- Zone map with approximate proportions\n' +
    '- Exact on-image text (headline/subhead/microcopy/CTA)\n' +
    '- Scene subject, people count, diversity, wardrobe, expression, props\n' +
    '- Brand styling translation (colors, typography, shapes, panels, gradients, icon style)\n' +
    '- Contrast/overlay strategy for readability\n' +
    '- Rendering style and quality constraints\n\n' +
    'COPY RULES:\n' +
    '- Derive text from caption meaning; make it specific and benefit-led (not generic).\n' +
    '- Headline: 4–9 words, ideally <= ~38 characters.\n' +
    '- Subhead: 1 line, ideally <= ~60 characters.\n' +
    '- Optional microcopy: either 1 short helper line OR 2 micro-bullets (very short).\n' +
    '- Total on-image words should remain low for reliable text rendering.\n' +
    '- Never include the brand/company name unless brand system explicitly allows/requires.\n' +
    '- Do NOT write font names or hex codes on the image itself. Use them only for internal style reference.\n\n' +
    'DEFAULT SPEC (USE UNLESS BRAND SYSTEM OVERRIDES):\n' +
    '- Format: 1:1 square, 1080x1080.\n' +
    '- Safe margins: at least 6% padding from all edges.\n' +
    '- Grid: simple 12-column feel; align text blocks cleanly.\n' +
    '- Type scale guidance (relative, not literal px): Headline XL, Subhead L, Microcopy M, CTA L Bold.\n' +
    '- Shadows: subtle, clean, modern; avoid heavy drop shadows.\n\n' +
    'MEGAPROMPT STRUCTURE REQUIREMENTS (MUST INCLUDE ALL ELEMENTS BELOW INSIDE THE MEGAPROMPT TEXT):\n' +
    'Use labeled lines. Do NOT use markdown. Do NOT use bullets symbols (•, -, *). Plain labeled lines only.\n\n' +
    'Your MEGAPROMPT must contain these labels in this order:\n' +
    'CANVAS:\n' +
    'GRID:\n' +
    'LAYOUT:\n' +
    'TEXT:\n' +
    'SCENE:\n' +
    'COLORS:\n' +
    'TYPE:\n' +
    'CTA:\n' +
    'LOGO ZONE:\n' +
    'READABILITY:\n' +
    'RENDER:\n' +
    'QC:\n\n' +
    'QC LINE MUST CONFIRM:\n' +
    '"logo zone empty, CTA verbatim, no brand name unless allowed, mobile-readable"\n\n' +
    'NEGATIVE SECTION REQUIREMENTS:\n' +
    'Write a second block labeled NEGATIVE with explicit exclusions and failure modes.\n' +
    'Must explicitly forbid:\n' +
    '- Any logo/brandmark/wordmark/watermark\n' +
    '- Any text inside the logo zone (including the word "Logo")\n' +
    '- Any brand/company name text unless allowed by brand system\n' +
    '- Any CTA changes (no paraphrase, no quotes)\n' +
    '- Clutter, low contrast, tiny text, busy background behind text\n' +
    '- Low-res, artifacts, distorted faces/hands, uncanny anatomy\n' +
    '- Watermarks, mock UI, random signage text, extra unreadable text blocks\n' +
    '- Rendering font names (e.g. "Roboto", "Sans Serif") as visual text\n' +
    '- Rendering hex codes (e.g. "#FF0000") as visual text\n\n' +
    'OUTPUT FORMAT (STRICT — FOLLOW EXACTLY):\n\n' +
    'MEGAPROMPT:\n' +
    '<Multi-line labeled spec block. Only plain text.>\n\n' +
    'NEGATIVE:\n' +
    '<Multi-line labeled exclusions. Only plain text.>\n\n' +
    'HARD RULES:\n' +
    '- Output ONLY the MEGAPROMPT and NEGATIVE sections.\n' +
    '- Do NOT include explanations, commentary, headings, markdown, or multiple concepts.\n' +
    '- Do NOT restate the brand system instruction.\n' +
    '- Do NOT output JSON.\n';
/**
 * Store this in: brandKB.imageUserText
 * Brand-agnostic runtime inputs: finalCaption + finalCTA only.
 */
export const IMAGE_GENERATION_USER_PROMPT =
    'Generate an on-brand square (1:1) social image concept based on:\n\n' +
    'Final caption (meaning must be reflected visually): {{contentCalendar.finalCaption}}\n\n' +
    'CTA button label (MUST appear EXACTLY as written, verbatim, no changes, no quotes): {{contentCalendar.finalCTA}}\n\n' +
    'Non-negotiables:\n' +
    '1) Reserve an EMPTY logo placement zone with safe margins; do not render any logo/brand name and do not write the word "Logo".\n' +
    '2) Do not render the company/brand name anywhere unless the brand system instruction explicitly allows or requires it.\n' +
    '3) Include a prominent CTA element near the bottom using the EXACT CTA label above.\n' +
    '4) Make the primary photo/scene unmistakably tied to the caption topic (avoid generic unrelated office imagery).\n' +
    '5) Maintain clean hierarchy and small-screen readability.\n\n' +
    'Copy guidance:\n' +
    'Generate specific on-image text derived from the caption meaning:\n' +
    'Headline: 4–9 words.\n' +
    'Subhead: 1 line.\n' +
    'Optional microcopy: 1 short helper line OR 2 micro-bullets.\n' +
    'Keep total words low so the text renders clearly.\n';




// --- BRAND RULES GENERATION PROMPTS ---

export const BRAND_PACK_SYSTEM_PROMPT =
    'Return a BRAND PACK based only on the inputs below. Output strictly as professional human-readable Markdown. Do NOT output JSON.\n\nStart your output with:\nBRAND_PACK_START\nThen immediately write section 1 (no blank lines before section 1).\n\nINPUTS...';

export const BRAND_PACK_USER_PROMPT =
    'Brand intelligence input (JSONB):{{FORM_ANSWER}}\n\nTASK:\nGenerate a BRAND PACK that closely matches the structure, tone, and rigor of the following characteristics:\n\n- Numbered sections\n- Clear headings\n- Bullet points over prose\n- Reads like a governance document, not website copy\n- Calm authority, no hype\n- Written for founders and operators\n\nThe Brand Pack MUST include these sections (use exact or near-exact headings):\n\n1) Brand Reality / Absolute Truths (Non-Negotiable)\n- Explicit truths from input\n- If missing, state “Not specified”\n\n2) Offerings Summary\n- What the brand sells\n- What the brand does NOT do (hard exclusions)\n\n3) Target Audience Summary\n- Primary and secondary audiences\n- Use conservative descriptions if limited data\n\n4) Tone Rules (Strict)\n- Interpret tone sliders into enforceable writing rules\n- Plain-language requirement\n- Define emoji usage based on the "voice.emojiUsage" field in the input (e.g. "Rarely", "sometimes", "often")\n\n5) Compliance / Legal Constraints (Hard Rules)\n- Explicit prohibitions\n- Regulated industry handling\n\n6) Required Language Framing\n- Phrases to prefer\n- Framing guidance\n\n7) Forbidden Words / Phrases\n- Derived from guardrails.noSay and safety defaults\n\n8) Execution Rules\n- Promotion balance (e.g. 80/20)\n- Structural guidance\n\n9) Language Simplicity Rule (Non-Negotiable)\n- Non-technical, founder-readable requirement\n\n10) Final Self-Check Checklist (Must Pass Before Output)\n- Bullet checklist enforcing accuracy, tone, compliance\n\nFormatting rules:\n- Use professional formatting (no emojis in the guide itself, unless defining emoji rules)\n- No marketing fluff\n- No mention of JSON, AI, or internal systems in the documentation content.\n- STRICTLY FORBIDDEN: Do NOT output the result as a JSON object or string. Use Plain Markdown only.\n- Clear, enforceable language\n\nThis Brand Pack will be treated as a permanent source of truth.';

export const BRAND_CAPABILITY_SYSTEM_PROMPT =
    'You are generating BRAND CAPABILITIES.\n\nBrand Capabilities are a structured internal reference that translates an existing Brand Pack into operational guidance for AI content systems.';

export const BRAND_CAPABILITY_USER_PROMPT =
    'INPUTS:\n\nBrand Intelligence JSON (supporting context):\n{{FORM_ANSWER}}\n\nBrand Pack (authoritative source):\n{{BRAND_PACK}}\n\nTASK:\nGenerate a BRAND CAPABILITIES document for this company. This document translates brand facts into actionable rules for an AI.\n\nSTRUCTURE:\n1. Core Offers: What are we actually selling? What is the value prop?\n2. Feature-to-Benefit Map: List 3-5 primary features and their corresponding benefits.\n3. Brand Differentiators: What makes us unique?\n4. Audience Nuances: How do we talk to specific personas mentioned in the Brand Pack?\n5. Industry Safety: How to handle technical or regulated topics.\n\nFORMATTING RULES:\n- Use Markdown only.\n- Use bolding for emphasis.\n- Use bullet points for readability.\n- STRICTLY FORBIDDEN: Do NOT output JSON. Do NOT output a single JSON object. Output professional, human-readable documentation only.';

export const WRITER_AGENT_SYSTEM_PROMPT =
    'You are a PROMPT ENGINEER.\n\nYou are generating a reusable CAPTION WRITER SYSTEM PROMPT.';

export const WRITER_AGENT_USER_PROMPT = `Inputs:
Brand Pack: {{BRAND_PACK}}
Brand Capabilities: {{BRAND_CAP}}

TASK:
Generate a CAPTION WRITER SYSTEM PROMPT for this brand. This will be the master "System Instruction" for another AI that writes social media captions.

THE SYSTEM PROMPT YOU GENERATE MUST INSTRUCT THE WRITER TO:
1. Embody the brand voice and tone defined in the Brand Pack.
2. Use the Brand Capability Map as the source of truth for facts and offers.
3. Structure captions with a clear hook, value-led body, and a strong CTA at the very end of the text.
4. Output the FINISHED caption in valid JSON format with "framework", "caption", "cta", and "hashtags".
5. Always provide a relevant CTA and 3-8 hashtags even if not explicitly provided in the request. Ensure the CTA is also written as the final line of the "caption" field.
6. Follow all "Absolute Truths" and strictly avoid "Forbidden Words".

FORMATTING RULES FOR THIS TASK:
- Output the System Prompt as a clean, Markdown-formatted professional instruction sheet.
- Start with "You are the Social Media Caption Writer for [Brand Name]..."
- USE HEADINGS AND BULLETS.
- STRICTLY FORBIDDEN: Do NOT wrap these instructions in a JSON object. Do NOT return a JSON string. Output PLAIN TEXT / MARKDOWN only.
- Do NOT include any meta-commentary about JSON or AI in the instructions themselves unless instructing the writer on its output format.

OUTPUT THE FINAL SYSTEM PROMPT BELOW:`;

export const REVIEWER_AGENT_SYSTEM_PROMPT =
    'You are a PROMPT ENGINEER.\n\nYou are generating a CAPTION REVIEWER & APPROVER SYSTEM PROMPT.';

export const REVIEWER_AGENT_USER_PROMPT = `Inputs:
Brand Pack: {{BRAND_PACK}}
Brand Capabilities: {{BRAND_CAP}}

TASK:
Generate a CAPTION REVIEWER SYSTEM PROMPT for this specific brand. This will be the master "System Instruction" for another AI that audits social media captions.

This prompt will be used to instruct a "Reviewer AI" that audits social media captions.

THE SYSTEM PROMPT YOU GENERATE MUST INSTRUCT THE REVIEWER TO:
1. Act as a critical brand guardian and editor.
2. Cross-reference every draft against the Brand Pack and Brand Capabilities provided above.
3. Check for tone consistency, absolute truths, and forbidden words.
4. Correct the content directly to make it "Review-Ready".
5. ALWAYS output the results in the following sections: DECISION, NOTES, FINAL CAPTION, FINAL CTA, and FINAL HASHTAGS.
6. MANDATORY RULE: The Reviewer MUST NEVER leave FINAL CTA or FINAL HASHTAGS empty. If the drafts are empty, the Reviewer must generate them using the Brand Capabilities and the primary goal of the content.
7. The FINAL CAPTION MUST always end with the FINAL CTA as its last paragraph or sentence.
8. If a user provided a specific CTA in the draft, the Reviewer MUST preserve it exactly unless it violates a hard compliance rule.

FORMATTING RULES FOR THIS TASK:
- Output the System Prompt as a clean, Markdown-formatted professional instruction sheet.
- Start with "You are the Brand Guardian and Content Reviewer for [Brand Name]..."
- USE HEADINGS AND BULLETS.
- STRICTLY FORBIDDEN: Do NOT wrap these instructions in a JSON object. Do NOT return a JSON string. Output PLAIN TEXT / MARKDOWN only.

OUTPUT THE FINAL SYSTEM PROMPT BELOW:`;

export const VISUAL_IDENTITY_SYSTEM_PROMPT =
    'You are a VISUAL BRAND STRATEGIST and PROMPT ENGINEER.\n\nYour task is to generate a set of VISUAL IDENTITY GUIDELINES (System Instruction)...';

export const VISUAL_IDENTITY_USER_PROMPT =
    'Inputs:\nBrand Pack:{{BRAND_PACK}}\nBrand Capabilities:{{BRAND_CAP}}\nBrand JSON:{{FORM_ANSWER}}\n\nTASK:\nGenerate a "Visual Identity Rule" (System Instruction) for this brand.\n\nCRITICAL: You MUST follow this EXACT Markdown structure. Do not change the headings.\n\n## Visual Identity Guidelines for <Brand Name>\n\n### 1. Logo Usage\n- **Primary Logo**: [Define rules based on brand vibe]\n- **Clear Space**: [Define standard clear space]\n- **Logo Variations**: [Define light/dark usage]\n\n### 2. Color Palette\n- **Primary Colors**:\n  - [Extract from Brand JSON.visualIdentity.primaryColors or infer]\n- **Secondary Colors**:\n  - [Extract or infer complementary colors]\n- **Color Use**: [Define usage ratio]\n\n### 3. Typography\n- **Primary Typeface**: [Suggest a Google Font that matches the brand voice (e.g. Inter, Playfair Display, Roboto)]\n- **Secondary Typeface**: [Suggest a matching body font]\n- **Hierarchy**: [Define header/body weights]\n\n### 4. Imagery\n- **Imagery Style**: [Define style based on Brand Pack tone]\n- **Color Overlay**: [Define if/how to use brand colors on images]\n- **Iconography**: [Define icon style: outline, filled, flat, 3D, etc.]\n\n### 5. Visual Applications\n- **Business Collateral**: [Rules for cards, docs]\n- **Digital Presence**: [Rules for social/web]\n- **Signage**: [Rules for physical/digital signage]\n\n### 6. Brand Consistency\n- **Visual Tone**: [Summarize the visual vibe]\n- **A/B Testing**: [Standard recommendation]\n\n### 7. Compliance\n- **Legal Review**: [Standard reminder]\n\n### Final Note\n[Standard cohesion reminder]\n\nINSTRUCTIONS:\n- Fill in the bracketed [...] content with SPECIFIC, PRESCRIPTIVE rules derived from the Brand Pack and Brand JSON.\n- USE THE ACTUAL COLORS found in Brand JSON if available.\n- SUGGEST ACTUAL FONTS (Google Fonts) that fit the brand personality.\n- Do not use placeholders like "Insert color here". YOU must decide the color/font if it is missing.\n- Keep it professional and authoritative.';
