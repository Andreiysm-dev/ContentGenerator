import db from '../database/db.js';

const callOpenAIText = async ({ systemPrompt, userPrompt, temperature = 1 }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Missing OPENAI_API_KEY' };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt || '' },
        { role: 'user', content: userPrompt || '' },
      ],
    }),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    const detail = typeof raw === 'string' && raw.trim() ? `: ${raw.slice(0, 500)}` : '';
    return { ok: false, error: `OpenAI error ${res.status}${detail}`, raw };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'OpenAI returned non-JSON response envelope', raw };
  }

  const content = data?.choices?.[0]?.message?.content;
  return { ok: true, content: typeof content === 'string' ? content : '', rawEnvelope: data };
};

export async function generateBrandRulesSystem(payload = {}) {
  const { companyId, brandKbId, formAnswer } = payload || {};

  if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
    return { ok: false, status: 400, error: 'companyId is required' };
  }
  if (!brandKbId || typeof brandKbId !== 'string' || !brandKbId.trim()) {
    return { ok: false, status: 400, error: 'brandKbId is required' };
  }
  if (formAnswer == null) {
    return { ok: false, status: 400, error: 'formAnswer is required' };
  }

  const formAnswerText = typeof formAnswer === 'string' ? formAnswer : JSON.stringify(formAnswer);

  const brandPackSystem =
    'Return a BRAND PACK based only on the inputs below.\n\nStart your output with:\nBRAND_PACK_START\nThen immediately write section 1 (no blank lines before section 1).\n\nINPUTS\nBrand JSON (may contain empty strings):\n{{FORM_ANSWER}}\n\nRULES\n- Do NOT invent facts not supported by the JSON.\n- If something is missing, write "UNSPECIFIED" or give safe, conservative general guidance.\n- No hype. No guarantees. No fabricated credentials, pricing, timelines, or outcomes.\n- Must resemble the example style: numbered sections, clear rules, must-say/avoid, execution rules, final checklist.\n\nOUTPUT FORMAT (STRICT)\nBRAND_PACK_START\n1) Brand Reality / Absolute Truths (Non-Negotiable)\n...bullets / short statements\n\n2) Offerings Summary\nWhat <BrandName> Sells\n...\nWhat <BrandName> Does NOT Do\n...\n\n3) Target Audience Summary\n...\n\n4) Tone Rules (Strict)\n...\n\n5) Compliance / Legal Constraints (Hard Rules)\n...\n\n6) Required Language Framing\nUse:\n...\nAvoid:\n...\n\n7) Forbidden Words / Phrases\n...\n\n8) Execution Rules\n...\n\n9) Language Simplicity Rule (Non-Negotiable)\n...\n\n10) Final Self-Check Checklist (Must Pass Before Output)\n☐ ...';

  const brandPackUser =
    'Brand intelligence input (JSONB):{{FORM_ANSWER}}\n\nTASK:\nGenerate a BRAND PACK that closely matches the structure, tone, and rigor of the following characteristics:\n\n- Numbered sections\n- Clear headings\n- Bullet points over prose\n- Reads like a governance document, not website copy\n- Calm authority, no hype, no emojis\n- Written for founders and operators\n\nThe Brand Pack MUST include these sections (use exact or near-exact headings):\n\n1) Brand Reality / Absolute Truths (Non-Negotiable)\n- Explicit truths from input\n- If missing, state “Not specified”\n\n2) Offerings Summary\n- What the brand sells\n- What the brand does NOT do (hard exclusions)\n\n3) Target Audience Summary\n- Primary and secondary audiences\n- Use conservative descriptions if limited data\n\n4) Tone Rules (Strict)\n- Interpret tone sliders into enforceable writing rules\n- Plain-language requirement\n\n5) Compliance / Legal Constraints (Hard Rules)\n- Explicit prohibitions\n- Regulated industry handling\n\n6) Required Language Framing\n- Phrases to prefer\n- Framing guidance\n\n7) Forbidden Words / Phrases\n- Derived from guardrails.noSay and safety defaults\n\n8) Execution Rules\n- Promotion balance (e.g. 80/20)\n- Structural guidance\n\n9) Language Simplicity Rule (Non-Negotiable)\n- Non-technical, founder-readable requirement\n\n10) Final Self-Check Checklist (Must Pass Before Output)\n- Bullet checklist enforcing accuracy, tone, compliance\n\nFormatting rules:\n- No emojis\n- No marketing fluff\n- No mention of JSON, AI, or internal systems\n- Clear, enforceable language\n\nThis Brand Pack will be treated as a permanent source of truth.';

  const packRes = await callOpenAIText({
    systemPrompt: brandPackSystem.replaceAll('{{FORM_ANSWER}}', formAnswerText),
    userPrompt: brandPackUser.replaceAll('{{FORM_ANSWER}}', formAnswerText),
    temperature: 1,
  });

  if (!packRes.ok) {
    return { ok: false, status: 500, error: packRes.error };
  }

  const brandPack = (packRes.content || '').trim();

  const { error: savePackError } = await db
    .from('brandKB')
    .upsert(
      {
        brandKbId,
        companyId,
        brandPack,
        form_answer: formAnswerText,
      },
      { onConflict: 'brandKbId' },
    );

  if (savePackError) {
    return { ok: false, status: 500, error: 'Failed to save brandPack' };
  }

  const capabilitySystem =
    'You are generating BRAND CAPABILITIES.\n\nBrand Capabilities are a structured internal reference that translates an existing Brand Pack into operational guidance for AI content systems.\n\nThis is a derived document.\nIt does NOT redefine the brand.\nIt does NOT invent new rules.\nIt interprets and operationalizes the Brand Pack.\n\nYou are explicitly authorized to generate a full, detailed written document.\n\nWhen information is missing:\n- Generalize conservatively\n- Use neutral, non-specific language\n- Do not invent facts\n\nWrite clearly and decisively.\nThis is not marketing copy.\nThis is an internal reference document.';

  const capabilityUser =
    'INPUTS:\n\nBrand Intelligence JSON (supporting context):\n{{FORM_ANSWER}}\n\nBrand Pack (authoritative source):\n{{BRAND_PACK}}\n\nTASK:\nGenerate a BRAND CAPABILITIES document that operationalizes the Brand Pack into enforceable guidance for AI systems.\n\nThe purpose of this document is to guide:\n- Content generation\n- Content review\n- Approval and rejection decisions\n\nSTRUCTURE:\nUse numbered sections with the following exact headings:\n\n1) Brand Identity\n\n2) Offers & Services\n- Allowed\n- Explicitly Excluded\n\n3) Audience Segments\nFor each segment include:\n- Titles\n- Pain Points\n- Desired Outcomes\n- Objections\n- Buying Triggers\n- Vocabulary\n- Red Flags\n- Best Angles\n\nIf details are missing, generalize conservatively.\n\n4) Value Propositions & Differentiators\n- Only reflect what is supported by the Brand Pack\n\n5) Brand Voice & Style\n- Reinforce Brand Pack tone rules\n\n6) Messaging Rules\n- Must-Say\n- Avoid\n\n7) Content Pillars & Angles\n\n8) CTA Library\n- Primary\n- Secondary\n- Soft\n- Forbidden\n\n9) Channel Behavior\n- Platform-specific guidance where applicable\n\n10) Risk Matrix\n- High-risk topics\n- Auto-reject conditions\n\nRULES:\n- No invented facts\n- No guarantees\n- No hype\n- Conservative interpretation when uncertain\n\nOUTPUT REQUIREMENTS:\n- Output a complete written document\n- Do NOT explain your reasoning\n- Do NOT reference the inputs explicitly\n- Do NOT output JSON';

  const capRes = await callOpenAIText({
    systemPrompt: capabilitySystem,
    userPrompt: capabilityUser
      .replaceAll('{{FORM_ANSWER}}', formAnswerText)
      .replaceAll('{{BRAND_PACK}}', brandPack),
    temperature: 1,
  });

  if (!capRes.ok) {
    return { ok: false, status: 500, error: capRes.error };
  }

  const brandCapability = (capRes.content || '').trim();

  const { error: saveCapError } = await db
    .from('brandKB')
    .upsert(
      {
        brandKbId,
        companyId,
        brandCapability,
      },
      { onConflict: 'brandKbId' },
    );

  if (saveCapError) {
    return { ok: false, status: 500, error: 'Failed to save brandCapability' };
  }

  const writerSystem =
    'You are a PROMPT ENGINEER.\n\nYou are NOT writing captions.\n\nYou are generating a reusable CAPTION WRITER SYSTEM PROMPT that will later be used by another AI to write captions.';

  const writerUser =
    'Inputs:\nBrand Pack:{{BRAND_PACK}}\n\n\nBrand Capabilities:{{BRAND_CAP}}\n\nTASK:\nGenerate a CAPTION WRITER SYSTEM PROMPT that:\n\n- Sounds like a senior editor giving strict instructions\n- Matches the tone, rigor, and specificity of the provided example\n- Is brand-specific, not generic\n- Is written in direct, imperative language\n\nThe generated prompt MUST include:\n\n- Role definition (e.g. “You are the X Writer Agent”)\n- Core Writing Rules (Non-Negotiable)\n- Brand Rules\n- Execution Rules\n- Framework Rule\n- Output Format (STRICT)\n- Hard Prohibitions\n\nCritical rules:\n- The downstream writer MUST NOT explain reasoning\n- MUST NOT mention Brand Pack or Capabilities\n- MUST follow emoji, CTA, tone, and language simplicity rules\n- MUST output ONLY the specified structure (no JSON unless required)\n\nOUTPUT:\nReturn ONLY the full system prompt text.';

  const writerRes = await callOpenAIText({
    systemPrompt: writerSystem,
    userPrompt: writerUser.replaceAll('{{BRAND_PACK}}', brandPack).replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
  });

  if (!writerRes.ok) {
    return { ok: false, status: 500, error: writerRes.error };
  }

  const writerAgent = (writerRes.content || '').trim();

  const reviewerSystem =
    'You are a PROMPT ENGINEER.\n\nYou are generating a CAPTION REVIEWER & APPROVER SYSTEM PROMPT.\n\nYou are NOT reviewing content now.';

  const reviewerUser =
    'Inputs:\nBrand Pack:{{BRAND_PACK}}\nBrand Capabilities:{{BRAND_CAP}}\n\nTASK:\nGenerate a CAPTION REVIEWER SYSTEM PROMPT that:\n\n- Acts as an editor + approver, not a critic\n- Fixes content when possible\n- Rejects only when unfixable\n- Enforces plain language strictly\n- Prioritizes compliance over creativity\n\nThe generated prompt MUST include:\n\n- Role definition\n- Primary Responsibilities\n- Plain-Language Enforcement (Hard Rule)\n- Compliance & Risk Rules\n- Approval Logic\n- Output Format (STRICT)\n- Hard Prohibitions\n\nRules:\n- Reviewer may rewrite content\n- Reviewer must not invent new claims\n- Reviewer must not mention internal systems\n- Output must match the strict format exactly\n\nOUTPUT:\nReturn ONLY the full system prompt text.';

  const reviewerRes = await callOpenAIText({
    systemPrompt: reviewerSystem,
    userPrompt: reviewerUser.replaceAll('{{BRAND_PACK}}', brandPack).replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
  });

  if (!reviewerRes.ok) {
    return { ok: false, status: 500, error: reviewerRes.error };
  }

  const reviewPrompt1 = (reviewerRes.content || '').trim();

  const emojiRule =
    typeof formAnswer === 'object' && formAnswer
      ? (formAnswer?.voice?.emojiUsage ?? null)
      : null;

  const { data: updatedRows, error: finalSaveError } = await db
    .from('brandKB')
    .upsert(
      {
        brandKbId,
        companyId,
        writerAgent,
        reviewPrompt1,
        emojiRule: emojiRule != null ? String(emojiRule) : null,
      },
      { onConflict: 'brandKbId' },
    )
    .select();

  if (finalSaveError) {
    return { ok: false, status: 500, error: 'Failed to save brand rules outputs' };
  }

  const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

  return {
    ok: true,
    status: 200,
    brandKB: updated,
    outputs: {
      brandPack,
      brandCapability,
      writerAgent,
      reviewPrompt1,
      emojiRule: emojiRule != null ? String(emojiRule) : null,
    },
  };
}
