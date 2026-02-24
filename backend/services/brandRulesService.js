import db from '../database/db.js';
import { logApiUsage } from './apiUsageService.js';
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

const callOpenAIText = async ({ systemPrompt, userPrompt, temperature = 1, companyId, userId }) => {
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

  // Log Usage
  if (data?.usage) {
    await logApiUsage({
      companyId,
      userId,
      provider: 'openai',
      model: model,
      type: 'completion',
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      metadata: { type: 'brand_rules_generation' }
    });
  }

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
    companyId,
    // Note: User ID might not be in payload here, but usually it's triggered by user
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
    companyId
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
    companyId
  });

  const reviewerPromise = callOpenAIText({
    systemPrompt: REVIEWER_AGENT_SYSTEM_PROMPT,
    userPrompt: REVIEWER_AGENT_USER_PROMPT
      .replaceAll('{{BRAND_PACK}}', brandPack)
      .replaceAll('{{BRAND_CAP}}', brandCapability),
    temperature: 1,
    companyId
  });

  const [writerRes, reviewerRes] = await Promise.all([
    writerPromise,
    reviewerPromise,
  ]);

  if (!writerRes.ok) {
    return { ok: false, status: 500, error: `Writer Agent failed: ${writerRes.error}` };
  }
  const writerAgent = (writerRes.content || '').trim();

  if (!reviewerRes.ok) {
    return { ok: false, status: 500, error: `Reviewer Agent failed: ${reviewerRes.error}` };
  }
  const reviewPrompt1 = (reviewerRes.content || '').trim();

  // Visual identity is no longer generated during initial onboarding
  const systemInstruction = null;

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

export async function generateVisualIdentitySystem(payload = {}) {
  const { companyId, brandKbId, visualOnboardingState } = payload || {};

  if (!brandKbId) return { ok: false, status: 400, error: 'brandKbId is required' };

  // 1) Fetch existing brandKB to get Brand Pack and Capabilities
  const { data: brandKB, error: fetchError } = await db
    .from('brandKB')
    .select('brandPack, brandCapability, form_answer')
    .eq('brandKbId', brandKbId)
    .single();

  if (fetchError || !brandKB) {
    return { ok: false, status: 404, error: 'Brand knowledge base entry not found' };
  }

  const { brandPack, brandCapability, form_answer } = brandKB;
  const formAnswerText = typeof form_answer === 'string' ? form_answer : JSON.stringify(form_answer);
  const visualStateText = JSON.stringify(visualOnboardingState);

  // 2) Generate Visual Identity Guidelines
  // We use the VISUAL_IDENTITY_USER_PROMPT but inject the specific wizard results as well
  const visualRes = await callOpenAIText({
    systemPrompt: VISUAL_IDENTITY_SYSTEM_PROMPT,
    userPrompt: VISUAL_IDENTITY_USER_PROMPT
      .replaceAll('{{BRAND_PACK}}', brandPack || '')
      .replaceAll('{{BRAND_CAP}}', brandCapability || '')
      .replaceAll('{{FORM_ANSWER}}', `${formAnswerText}\n\nUSER VISUAL PREFERENCES: ${visualStateText}`),
    temperature: 1,
    companyId
  });

  if (!visualRes.ok) {
    return { ok: false, status: 500, error: `Visual Identity generation failed: ${visualRes.error}` };
  }

  const systemInstruction = (visualRes.content || '').trim();

  // 3) Update the database
  const { data: updatedRows, error: updateError } = await db
    .from('brandKB')
    .update({ systemInstruction })
    .eq('brandKbId', brandKbId)
    .select();

  if (updateError) {
    return { ok: false, status: 500, error: 'Failed to save visual identity guidelines' };
  }

  return {
    ok: true,
    status: 200,
    systemInstruction,
    brandKB: updatedRows?.[0] || null,
  };
}
