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

  // 3) Generate Writer Agent Prompt
  const writerSystem = WRITER_AGENT_SYSTEM_PROMPT;

  const writerUser = WRITER_AGENT_USER_PROMPT;

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
  const reviewerSystem = REVIEWER_AGENT_SYSTEM_PROMPT;

  const reviewerUser = REVIEWER_AGENT_USER_PROMPT;

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
  const visualSystem = VISUAL_IDENTITY_SYSTEM_PROMPT;

  const visualUser = VISUAL_IDENTITY_USER_PROMPT;

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
