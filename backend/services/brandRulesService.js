import db from '../database/db.js';
import {
  BRAND_PACK_SYSTEM_PROMPT,
  BRAND_PACK_USER_PROMPT,
  BRAND_CAPABILITY_SYSTEM_PROMPT,
  BRAND_CAPABILITY_USER_PROMPT,
  WRITER_AGENT_SYSTEM_PROMPT,
  WRITER_AGENT_USER_PROMPT,
  REVIEWER_AGENT_SYSTEM_PROMPT,
  REVIEWER_AGENT_USER_PROMPT,
  VISUAL_IDENTITY_SYSTEM_PROMPT,
  VISUAL_IDENTITY_USER_PROMPT
} from './prompts.js';

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

  const brandPackSystem = BRAND_PACK_SYSTEM_PROMPT;

  const brandPackUser = BRAND_PACK_USER_PROMPT;

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
  const capabilitySystem = BRAND_CAPABILITY_SYSTEM_PROMPT;

  const capabilityUser = BRAND_CAPABILITY_USER_PROMPT;

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

  // 3) Generate Writer Agent, Reviewer Agent, and Visual Identity in PARALLEL
  // They all depend on Brand Pack & Capabilities, but not on each other.

  const writerPromise = callOpenAIText({
    systemPrompt: WRITER_AGENT_SYSTEM_PROMPT,
    userPrompt: WRITER_AGENT_USER_PROMPT
      .replaceAll('{{BRAND_PACK}}', brandPack)
      .replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
  });

  const reviewerPromise = callOpenAIText({
    systemPrompt: REVIEWER_AGENT_SYSTEM_PROMPT,
    userPrompt: REVIEWER_AGENT_USER_PROMPT
      .replaceAll('{{BRAND_PACK}}', brandPack)
      .replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
  });

  const visualPromise = callOpenAIText({
    systemPrompt: VISUAL_IDENTITY_SYSTEM_PROMPT,
    userPrompt: VISUAL_IDENTITY_USER_PROMPT
      .replaceAll('{{BRAND_PACK}}', brandPack)
      .replaceAll('{{BRAND_CAP}}', brandCapability)
      .replaceAll('{{FORM_ANSWER}}', formAnswerText),
    temperature: 1,
  });

  const [writerRes, reviewerRes, visualRes] = await Promise.all([
    writerPromise,
    reviewerPromise,
    visualPromise,
  ]);

  if (!writerRes.ok) {
    return { ok: false, status: 500, error: `Writer Agent failed: ${writerRes.error}` };
  }
  const writerAgent = (writerRes.content || '').trim();

  if (!reviewerRes.ok) {
    return { ok: false, status: 500, error: `Reviewer Agent failed: ${reviewerRes.error}` };
  }
  const reviewPrompt1 = (reviewerRes.content || '').trim();

  // Visual identity is technically optional if it fails, but better to be consistent
  // The current logic allowed it to be null if failed? Let's check original code.
  // Original: const systemInstruction = visualRes.ok ? (visualRes.content || '').trim() : null;
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
