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

  // 2) Generate Brand Capabilities
  const capabilitySystem =
    'You are generating BRAND CAPABILITIES.\n\nBrand Capabilities are a structured internal reference that translates an existing Brand Pack into operational guidance for AI content systems.';

  const capabilityUser =
    'INPUTS:\n\nBrand Intelligence JSON (supporting context):\n{{FORM_ANSWER}}\n\nBrand Pack (authoritative source):\n{{BRAND_PACK}}\n\nTASK:\nGenerate a BRAND CAPABILITIES document...';

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

  // 3) Generate Writer Agent Prompt
  const writerSystem =
    'You are a PROMPT ENGINEER.\n\nYou are generating a reusable CAPTION WRITER SYSTEM PROMPT.';

  const writerUser =
    'Inputs:\nBrand Pack:{{BRAND_PACK}}\nBrand Capabilities:{{BRAND_CAP}}\n\nTASK:\nGenerate a CAPTION WRITER SYSTEM PROMPT...';

  const writerRes = await callOpenAIText({
    systemPrompt: writerSystem,
    userPrompt: writerUser.replaceAll('{{BRAND_PACK}}', brandPack).replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
  });

  if (!writerRes.ok) {
    return { ok: false, status: 500, error: writerRes.error };
  }

  const writerAgent = (writerRes.content || '').trim();

  // 4) Generate Reviewer Prompt
  const reviewerSystem =
    'You are a PROMPT ENGINEER.\n\nYou are generating a CAPTION REVIEWER & APPROVER SYSTEM PROMPT.';

  const reviewerUser =
    'Inputs:\nBrand Pack:{{BRAND_PACK}}\nBrand Capabilities:{{BRAND_CAP}}\n\nTASK:\nGenerate a CAPTION REVIEWER SYSTEM PROMPT...';

  const reviewerRes = await callOpenAIText({
    systemPrompt: reviewerSystem,
    userPrompt: reviewerUser.replaceAll('{{BRAND_PACK}}', brandPack).replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
  });

  if (!reviewerRes.ok) {
    return { ok: false, status: 500, error: reviewerRes.error };
  }

  const reviewPrompt1 = (reviewerRes.content || '').trim();

  // 5) Generate Visual Identity Rule (systemInstruction)
  const visualSystem =
    'You are a VISUAL BRAND STRATEGIST and PROMPT ENGINEER.\n\nYour task is to generate a set of VISUAL IDENTITY GUIDELINES (System Instruction)...';

  const visualUser =
    'Inputs:\nBrand Pack:{{BRAND_PACK}}\nBrand Capabilities:{{BRAND_CAP}}\nBrand JSON:{{FORM_ANSWER}}\n\nTASK:\nGenerate a "Visual Identity Rule"...';

  const visualRes = await callOpenAIText({
    systemPrompt: visualSystem,
    userPrompt: visualUser
      .replaceAll('{{BRAND_PACK}}', brandPack)
      .replaceAll('{{BRAND_CAP}}', brandCapability)
      .replaceAll('{{FORM_ANSWER}}', formAnswerText),
    temperature: 1,
  });

  const systemInstruction = visualRes.ok ? (visualRes.content || '').trim() : null;

  const emojiRule =
    typeof formAnswer === 'object' && formAnswer
      ? (formAnswer?.voice?.emojiUsage ?? null)
      : null;

  // Single final upsert to prevent data loss
  const { data: updatedRows, error: finalSaveError } = await db
    .from('brandKB')
    .upsert(
      {
        brandKbId,
        companyId,
        brandPack,
        brandCapability,
        writerAgent,
        reviewPrompt1,
        systemInstruction,
        emojiRule: emojiRule != null ? String(emojiRule) : null,
        form_answer: formAnswerText,
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
      systemInstruction,
      emojiRule: emojiRule != null ? String(emojiRule) : null,
    },
  };
}
