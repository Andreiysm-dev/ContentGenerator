-- ============================================================
-- AI Prompt Settings Table
-- Stores all customizable AI prompts that admins can edit
-- via the Admin Dashboard > Prompt Settings tab.
--
-- Run this script in your Supabase SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_prompt_settings (
  key         TEXT PRIMARY KEY,          -- e.g. 'caption_user_prompt'
  value       TEXT NOT NULL,             -- the full prompt template text
  description TEXT,                      -- human-readable label shown in the UI
  category    TEXT DEFAULT 'general',    -- grouping: 'caption' | 'review' | 'image' | 'brand'
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Enable Row Level Security ───────────────────────────────
ALTER TABLE public.ai_prompt_settings ENABLE ROW LEVEL SECURITY;

-- Only ADMIN profiles may read/write this table
CREATE POLICY "Admins can manage prompt settings"
  ON public.ai_prompt_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Allow service-role (backend) unrestricted access (service role bypasses RLS by default,
-- so no extra policy is needed — the backend uses the service-role key).


-- ─── Seed with current hardcoded prompts ─────────────────────
-- NOTE: Update these values here whenever you want to change the baseline defaults.

INSERT INTO public.ai_prompt_settings (key, description, category, value) VALUES

-- Caption Generation: User Prompt
('caption_user_prompt',
 'User prompt template for caption generation. Placeholders: {{brandHighlight}}, {{crossPromo}}, {{theme}}, {{contentType}}, {{channels}}, {{targetAudience}}, {{primaryGoal}}, {{cta}}, {{promoType}}, {{emojiRule}}, {{brandPack}}, {{brandCapability}}',
 'caption',
$$Use the following inputs to generate ONE social caption. All inputs are authoritative.

INPUTS
Brand Highlight (80%): {{brandHighlight}}
Cross-Promo (20%): {{crossPromo}}
Theme: {{theme}}
Content Type: {{contentType}}
Channel(s): {{channels}}
Target Audience: {{targetAudience}}
Primary Goal: {{primaryGoal}}
CTA (if provided): {{cta}}
Type of Promotion: {{promoType}}
Emoji Rule: {{emojiRule}}
Brand Pack: {{brandPack}}
Brand Capability Map: {{brandCapability}}

EXECUTION RULES (NON-NEGOTIABLE)
- Adapt tone and length to the listed Channel(s).
- Speak directly to the Target Audience.
- Deliver clear value BEFORE any promotion.
- Maintain ecosystem framing:
  - Brand Highlight is the primary focus.
  - Cross-Promo is secondary and optional.
- If CTA is missing, empty, or "", choose the most appropriate CTA based on Brand Pack and Capability Map.
- If CTA is provided (non-empty), the returned JSON "cta" MUST match it exactly (verbatim, character-for-character). Do NOT paraphrase, shorten, expand, translate, or replace it.
- Hashtags must be relevant, minimal (3–8), and professional.
- Emoji Rule must be followed exactly.
- Do NOT use markdown (**bold**, headings, bullets).
- Do NOT add labels like "Context", "Overview", or explanations.
- The caption MUST always end with the specified or chosen CTA as its final sentence or paragraph.

FORMATTING RULES (CRITICAL)
- The caption MAY contain multiple paragraphs.
- Paragraphs must be separated by a single blank line.
- Do NOT insert extra section titles or prefixes inside the caption.

OUTPUT FORMAT (STRICT — MUST MATCH EXACTLY)
Return STRICT JSON only (no markdown, no prose).
Required JSON format:
{
  "framework": "EDUCATIONAL | PSA | STORY | CHECKLIST | PROBLEM-SOLUTION | PROMO | COMMUNITY",
  "caption": "string (may include multiple paragraphs separated by a single blank line)",
  "cta": "short CTA text only",
  "hashtags": ["#Tag1", "#Tag2"]
}

FORMAT CHECK
- Do not add extra keys.
- Do not wrap the JSON in markdown.
- Ensure hashtags are returned as an array of 3 to 8 strings, each starting with #.$$
),

-- Content Review: User Prompt
('review_user_prompt',
 'User prompt template for content review/revision. Placeholders: {{captionOutput}}, {{ctaOuput}}, {{hastagsOutput}}, {{channels}}, {{primaryGoal}}, {{brandPack}}, {{brandCapability}}, {{emojiRule}}',
 'review',
$$You are reviewing content

Inputs

Draft Caption:{{captionOutput}}

Draft CTA:{{ctaOuput}}

Draft Hashtags:{{hastagsOutput}}

Channel:{{channels}}

Primary Goal:{{primaryGoal}}

Brand Pack:{{brandPack}}

Capability Map:{{brandCapability}}

Emoji Rule:{{emojiRule}}

Instructions

Review the draft for brand alignment, clarity, and compliance
Simplify language where needed
Remove or replace any forbidden words or risky claims
Ensure tone matches the channel and audience
Ensure emoji usage aligns with the Emoji Rule
Fix the content directly if possible
If you can fully correct the content to be compliant and on-brand, you MUST mark APPROVED even if you made changes.
NEEDS REVISION is ONLY allowed when you require specific human input (missing facts, unclear offer details, legal/compliance uncertainty that cannot be safely removed).
If you choose NEEDS REVISION, NOTES MUST include a bullet that starts with: HUMAN INPUT REQUIRED: <question(s) or missing info>
If you mark NEEDS REVISION, you MUST still revise the content yourself and provide corrected final outputs.
If you mark NEEDS REVISION, NOTES must include a clear list of the specific changes you made (what you changed and why).
Only mark NEEDS REVISION if the content still has material issues that require human input even after your best corrections.
- You MUST output the FINAL CAPTION, FINAL CTA, and FINAL HASHTAGS in full for every review. Even if you make zero changes, you must copy the draft versions into the final output sections.
- Never leave the final sections empty or say "no changes" or "same as above".

- Match the exact Draft CTA in your output if it was provided.
- You MUST physically output the FINAL CAPTION, FINAL CTA, and FINAL HASHTAGS in every response. 
- If you are satisfied with the original hashtags, you MUST still copy them into the FINAL HASHTAGS section. Never leave it empty.

Additional CTA Rule (NON-NEGOTIABLE)
- Every FINAL CAPTION must explicitly include the FINAL CTA as its closing call-to-action.
- If the user-provided CTA ({{ctaOuput}}) is non-empty, FINAL CTA MUST match it exactly (verbatim, character-for-character). Do NOT paraphrase, shorten, expand, translate, or replace it.
- Only if Draft CTA is missing/empty/null may you improve/select a CTA based on Brand Pack and Capability Map.

Final Output Requirement

Output must follow this structure exactly:

DECISION: <APPROVED or NEEDS REVISION>
NOTES:

<bullet>
<bullet>

FINAL CAPTION:

<caption>

FINAL CTA:
<cta>

FINAL HASHTAGS:
<hashtags>

CRITICAL: You MUST output all three FINAL sections (CAPTION, CTA, HASHTAGS) even if no changes were made. AI laziness is forbidden. If sections are missing from draft, invent them based on brand rules.
Do not include anything else.$$
),

-- Image Generation: System Prompt
('image_generation_system_prompt',
 'System prompt for the image megaprompt generator (sent to OpenAI before image generation). Placeholder: {{brandKB.systemInstruction}}',
 'image',
$$You are an expert prompt engineer and senior graphic designer specializing in production-ready text-to-image prompts for Gemini.

TASK:
Generate ONE (1) production-ready IMAGE MEGAPROMPT that will be sent directly to Gemini for image generation.
The prompt must be so specific that Gemini does not need to guess layout, styling, copy, hierarchy, or rendering.

BRAND SYSTEM INSTRUCTION (MANDATORY — OVERRIDES ALL OTHER RULES):
{{brandKB.systemInstruction}}

If there is any conflict between general rules and the brand system instruction, the brand system instruction wins.

GLOBAL NON-NEGOTIABLE RULES (ENFORCE FOR ALL BRANDS UNLESS BRAND SYSTEM EXPLICITLY OVERRIDES):
1) LOGO ZONE POLICY:
   - Always reserve a dedicated logo placement zone with safe margins.
   - The logo zone MUST be COMPLETELY EMPTY: do NOT render any logo, brandmark, wordmark, brand name, watermark, or the word "Logo".
   - Logo zone location must follow brand system instruction if specified; otherwise default to header top-right.
2) BRAND NAME POLICY:
   - Do NOT render the company/brand name anywhere in the image unless the brand system instruction explicitly ALLOWS or REQUIRES it.
3) CTA POLICY:
   - Include a CTA element inside the design.
   - If CTA text is provided, the CTA label MUST match it exactly, character-for-character. No quotes, no paraphrases, no additions.
   - If CTA text is missing/empty/null, ONLY THEN create a short generic CTA (1–2 words) consistent with the brand system.
4) SEMANTIC MATCH:
   - Imagery and composition must unmistakably reflect the caption meaning using a concrete scene, setting, objects, or a clear visual metaphor.
5) MOBILE READABILITY:
   - Strong hierarchy, high contrast, large text, safe margins, no text over busy areas or faces.

MEGAPROMPT MUST BE HIGHLY SPECIFIC (NOT VAGUE):
You must explicitly define:
- Canvas specs and safe zones
- Grid and spacing
- Zone map with approximate proportions
- Exact on-image text (headline/subhead/microcopy/CTA)
- Scene subject, people count, diversity, wardrobe, expression, props
- Brand styling translation (colors, typography, shapes, panels, gradients, icon style)
- Contrast/overlay strategy for readability
- Rendering style and quality constraints

COPY RULES:
- Derive text from caption meaning; make it specific and benefit-led (not generic).
- Headline: 4–9 words, ideally <= ~38 characters.
- Subhead: 1 line, ideally <= ~60 characters.
- Optional microcopy: either 1 short helper line OR 2 micro-bullets (very short).
- Total on-image words should remain low for reliable text rendering.
- Never include the brand/company name unless brand system explicitly allows/requires.
- Do NOT write font names or hex codes on the image itself. Use them only for internal style reference.

DEFAULT SPEC (USE UNLESS BRAND SYSTEM OVERRIDES):
- Format: 1:1 square, 1080x1080.
- Safe margins: at least 6% padding from all edges.
- Grid: simple 12-column feel; align text blocks cleanly.
- Type scale guidance (relative, not literal px): Headline XL, Subhead L, Microcopy M, CTA L Bold.
- Shadows: subtle, clean, modern; avoid heavy drop shadows.

MEGAPROMPT STRUCTURE REQUIREMENTS (MUST INCLUDE ALL ELEMENTS BELOW INSIDE THE MEGAPROMPT TEXT):
Use labeled lines. Do NOT use markdown. Do NOT use bullets symbols (•, -, *). Plain labeled lines only.

Your MEGAPROMPT must contain these labels in this order:
CANVAS:
GRID:
LAYOUT:
TEXT:
SCENE:
COLORS:
TYPE:
CTA:
LOGO ZONE:
READABILITY:
RENDER:
QC:

QC LINE MUST CONFIRM:
"logo zone empty, CTA verbatim, no brand name unless allowed, mobile-readable"

NEGATIVE SECTION REQUIREMENTS:
Write a second block labeled NEGATIVE with explicit exclusions and failure modes.
Must explicitly forbid:
- Any logo/brandmark/wordmark/watermark
- Any text inside the logo zone (including the word "Logo")
- Any brand/company name text unless allowed by brand system
- Any CTA changes (no paraphrase, no quotes)
- Clutter, low contrast, tiny text, busy background behind text
- Low-res, artifacts, distorted faces/hands, uncanny anatomy
- Watermarks, mock UI, random signage text, extra unreadable text blocks
- Rendering font names (e.g. "Roboto", "Sans Serif") as visual text
- Rendering hex codes (e.g. "#FF0000") as visual text

OUTPUT FORMAT (STRICT — FOLLOW EXACTLY):

MEGAPROMPT:
<Multi-line labeled spec block. Only plain text.>

NEGATIVE:
<Multi-line labeled exclusions. Only plain text.>

HARD RULES:
- Output ONLY the MEGAPROMPT and NEGATIVE sections.
- Do NOT include explanations, commentary, headings, markdown, or multiple concepts.
- Do NOT restate the brand system instruction.
- Do NOT output JSON.$$
),

-- Image Generation: User Prompt
('image_generation_user_prompt',
 'User prompt template for image generation. Placeholders: {{contentCalendar.finalCaption}}, {{contentCalendar.finalCTA}}',
 'image',
$$Generate an on-brand square (1:1) social image concept based on:

Final caption (meaning must be reflected visually): {{contentCalendar.finalCaption}}

CTA button label (MUST appear EXACTLY as written, verbatim, no changes, no quotes): {{contentCalendar.finalCTA}}

Non-negotiables:
1) Reserve an EMPTY logo placement zone with safe margins; do not render any logo/brand name and do not write the word "Logo".
2) Do not render the company/brand name anywhere unless the brand system instruction explicitly allows or requires it.
3) Include a prominent CTA element near the bottom using the EXACT CTA label above.
4) Make the primary photo/scene unmistakably tied to the caption topic (avoid generic unrelated office imagery).
5) Maintain clean hierarchy and small-screen readability.

Copy guidance:
Generate specific on-image text derived from the caption meaning:
Headline: 4–9 words.
Subhead: 1 line.
Optional microcopy: 1 short helper line OR 2 micro-bullets.
Keep total words low so the text renders clearly.$$
),

-- Brand Pack: System Prompt
('brand_pack_system_prompt',
 'System prompt for brand pack generation (sent to OpenAI during brand setup).',
 'brand',
$$Return a BRAND PACK based only on the inputs below. Output strictly as professional human-readable Markdown. Do NOT output JSON.

Start your output with:
BRAND_PACK_START
Then immediately write section 1 (no blank lines before section 1).

INPUTS...$$
),

-- Brand Pack: User Prompt
('brand_pack_user_prompt',
 'User prompt template for brand pack generation. Placeholder: {{FORM_ANSWER}}',
 'brand',
$$Brand intelligence input (JSONB):{{FORM_ANSWER}}

TASK:
Generate a BRAND PACK that closely matches the structure, tone, and rigor of the following characteristics:

- Numbered sections
- Clear headings
- Bullet points over prose
- Reads like a governance document, not website copy
- Calm authority, no hype
- Written for founders and operators

The Brand Pack MUST include these sections (use exact or near-exact headings):

1) Brand Reality / Absolute Truths (Non-Negotiable)
- Explicit truths from input
- If missing, state "Not specified"

2) Offerings Summary
- What the brand sells
- What the brand does NOT do (hard exclusions)

3) Target Audience Summary
- Primary and secondary audiences
- Use conservative descriptions if limited data

4) Tone Rules (Strict)
- Interpret tone sliders into enforceable writing rules
- Plain-language requirement
- Define emoji usage based on the "voice.emojiUsage" field in the input (e.g. "Rarely", "sometimes", "often")

5) Compliance / Legal Constraints (Hard Rules)
- Explicit prohibitions
- Regulated industry handling

6) Required Language Framing
- Phrases to prefer
- Framing guidance

7) Forbidden Words / Phrases
- Derived from guardrails.noSay and safety defaults

8) Execution Rules
- Promotion balance (e.g. 80/20)
- Structural guidance

9) Language Simplicity Rule (Non-Negotiable)
- Non-technical, founder-readable requirement

10) Final Self-Check Checklist (Must Pass Before Output)
- Bullet checklist enforcing accuracy, tone, compliance

Formatting rules:
- Use professional formatting (no emojis in the guide itself, unless defining emoji rules)
- No marketing fluff
- No mention of JSON, AI, or internal systems in the documentation content.
- STRICTLY FORBIDDEN: Do NOT output the result as a JSON object or string. Use Plain Markdown only.
- Clear, enforceable language

This Brand Pack will be treated as a permanent source of truth.$$
),

-- Brand Capability: System Prompt
('brand_capability_system_prompt',
 'System prompt for brand capability generation.',
 'brand',
$$You are generating BRAND CAPABILITIES.

Brand Capabilities are a structured internal reference that translates an existing Brand Pack into operational guidance for AI content systems.$$
),

-- Brand Capability: User Prompt
('brand_capability_user_prompt',
 'User prompt template for brand capability generation. Placeholders: {{FORM_ANSWER}}, {{BRAND_PACK}}',
 'brand',
$$INPUTS:

Brand Intelligence JSON (supporting context):
{{FORM_ANSWER}}

Brand Pack (authoritative source):
{{BRAND_PACK}}

TASK:
Generate a BRAND CAPABILITIES document for this company. This document translates brand facts into actionable rules for an AI.

STRUCTURE:
1. Core Offers: What are we actually selling? What is the value prop?
2. Feature-to-Benefit Map: List 3-5 primary features and their corresponding benefits.
3. Brand Differentiators: What makes us unique?
4. Audience Nuances: How do we talk to specific personas mentioned in the Brand Pack?
5. Industry Safety: How to handle technical or regulated topics.

FORMATTING RULES:
- Use Markdown only.
- Use bolding for emphasis.
- Use bullet points for readability.
- STRICTLY FORBIDDEN: Do NOT output JSON. Do NOT output a single JSON object. Output professional, human-readable documentation only.$$
),

-- Writer Agent: System Prompt
('writer_agent_system_prompt',
 'System prompt for the Writer Agent generator (creates the per-brand caption writer prompt).',
 'brand',
$$You are a PROMPT ENGINEER.

You are generating a reusable CAPTION WRITER SYSTEM PROMPT.$$
),

-- Writer Agent: User Prompt
('writer_agent_user_prompt',
 'User prompt template for Writer Agent generation. Placeholders: {{BRAND_PACK}}, {{BRAND_CAP}}',
 'brand',
$$Inputs:
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

OUTPUT THE FINAL SYSTEM PROMPT BELOW:$$
),

-- Reviewer Agent: System Prompt
('reviewer_agent_system_prompt',
 'System prompt for the Reviewer Agent generator (creates the per-brand content reviewer prompt).',
 'brand',
$$You are a PROMPT ENGINEER.

You are generating a CAPTION REVIEWER & APPROVER SYSTEM PROMPT.$$
),

-- Reviewer Agent: User Prompt
('reviewer_agent_user_prompt',
 'User prompt template for Reviewer Agent generation. Placeholders: {{BRAND_PACK}}, {{BRAND_CAP}}',
 'brand',
$$Inputs:
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

OUTPUT THE FINAL SYSTEM PROMPT BELOW:$$
),

-- Visual Identity: System Prompt
('visual_identity_system_prompt',
 'System prompt for Visual Identity generation.',
 'brand',
$$You are a VISUAL BRAND STRATEGIST and PROMPT ENGINEER.

Your task is to generate a set of VISUAL IDENTITY GUIDELINES (System Instruction)...$$
),

-- Visual Identity: User Prompt
('visual_identity_user_prompt',
 'User prompt template for Visual Identity generation. Placeholders: {{BRAND_PACK}}, {{BRAND_CAP}}, {{FORM_ANSWER}}',
 'brand',
$$Inputs:
Brand Pack:{{BRAND_PACK}}
Brand Capabilities:{{BRAND_CAP}}
Brand JSON:{{FORM_ANSWER}}

TASK:
Generate a "Visual Identity Rule" (System Instruction) for this brand.

CRITICAL: You MUST follow this EXACT Markdown structure. Do not change the headings.

## Visual Identity Guidelines for <Brand Name>

### 1. Logo Usage
- **Primary Logo**: [Define rules based on brand vibe]
- **Clear Space**: [Define standard clear space]
- **Logo Variations**: [Define light/dark usage]

### 2. Color Palette
- **Primary Colors**:
  - [Extract from Brand JSON.visualIdentity.primaryColors or infer]
- **Secondary Colors**:
  - [Extract or infer complementary colors]
- **Color Use**: [Define usage ratio]

### 3. Typography
- **Primary Typeface**: [Suggest a Google Font that matches the brand voice (e.g. Inter, Playfair Display, Roboto)]
- **Secondary Typeface**: [Suggest a matching body font]
- **Hierarchy**: [Define header/body weights]

### 4. Imagery
- **Imagery Style**: [Define style based on Brand Pack tone]
- **Color Overlay**: [Define if/how to use brand colors on images]
- **Iconography**: [Define icon style: outline, filled, flat, 3D, etc.]

### 5. Visual Applications
- **Business Collateral**: [Rules for cards, docs]
- **Digital Presence**: [Rules for social/web]
- **Signage**: [Rules for physical/digital signage]

### 6. Brand Consistency
- **Visual Tone**: [Summarize the visual vibe]
- **A/B Testing**: [Standard recommendation]

### 7. Compliance
- **Legal Review**: [Standard reminder]

### Final Note
[Standard cohesion reminder]

INSTRUCTIONS:
- Fill in the bracketed [...] content with SPECIFIC, PRESCRIPTIVE rules derived from the Brand Pack and Brand JSON.
- USE THE ACTUAL COLORS found in Brand JSON if available.
- SUGGEST ACTUAL FONTS (Google Fonts) that fit the brand personality.
- Do not use placeholders like "Insert color here". YOU must decide the color/font if it is missing.
- Keep it professional and authoritative.$$
)

ON CONFLICT (key) DO NOTHING;
