import db from '../database/db.js';

import { CAPTION_USER_PROMPT_TEMPLATE } from './prompts.js';
import { sendNotification } from './notificationService.js';

const ALLOWED_FRAMEWORKS = new Set([
  'EDUCATIONAL',
  'PSA',
  'STORY',
  'CHECKLIST',
  'PROBLEM-SOLUTION',
  'PROMO',
  'COMMUNITY',
]);

const nowIso = () => new Date().toISOString();

const normalizeStatusState = (status) => {
  if (status == null) return { state: 'Draft' };

  if (typeof status === 'string') {
    const trimmed = status.trim();
    if (!trimmed) return { state: 'Draft' };
    if (trimmed.toLowerCase() === 'generate') return { state: 'Draft' };
    return { state: trimmed };
  }

  if (typeof status === 'object') {
    const raw = status.state;
    if (typeof raw === 'string' && raw.trim()) {
      const trimmed = raw.trim();
      if (trimmed.toLowerCase() === 'generate') return { state: 'Draft' };
      return { state: trimmed };
    }
  }

  return { state: 'Draft' };
};

const writeStatus = (state, extra = {}) => ({
  state,
  updatedAt: nowIso(),
  by: 'backend',
  ...extra,
});

const buildUserPrompt = ({ contentCalendar, brandKB }) => {
  const channelsValue = Array.isArray(contentCalendar.channels)
    ? contentCalendar.channels.join(', ')
    : contentCalendar.channels ?? '';

  return CAPTION_USER_PROMPT_TEMPLATE
    .replaceAll('{{brandHighlight}}', contentCalendar.brandHighlight ?? '')
    .replaceAll('{{crossPromo}}', contentCalendar.crossPromo ?? '')
    .replaceAll('{{theme}}', contentCalendar.theme ?? '')
    .replaceAll('{{contentType}}', contentCalendar.contentType ?? '')
    .replaceAll('{{channels}}', channelsValue)
    .replaceAll('{{targetAudience}}', contentCalendar.targetAudience ?? '')
    .replaceAll('{{primaryGoal}}', contentCalendar.primaryGoal ?? '')
    .replaceAll('{{cta}}', contentCalendar.cta ?? '')
    .replaceAll('{{promoType}}', contentCalendar.promoType ?? '')
    .replaceAll('{{emojiRule}}', brandKB?.emojiRule ?? '')
    .replaceAll('{{brandPack}}', brandKB?.brandPack ?? '')
    .replaceAll('{{brandCapability}}', brandKB?.brandCapability ?? '');
};

const safeParseModelJson = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'Empty OpenAI response', raw: text };
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'OpenAI response is not a JSON object', raw: text };
    }

    const frameworkRaw = typeof parsed.framework === 'string' ? parsed.framework.trim() : '';
    const framework = frameworkRaw.toUpperCase();
    const caption = typeof parsed.caption === 'string' ? parsed.caption : '';
    const cta = typeof parsed.cta === 'string' ? parsed.cta : '';
    const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags.filter((h) => typeof h === 'string') : [];

    if (!ALLOWED_FRAMEWORKS.has(framework)) {
      return { ok: false, error: `Invalid framework: ${frameworkRaw || '(missing)'}`, raw: text };
    }

    return {
      ok: true,
      value: {
        framework,
        caption,
        cta,
        hashtags,
      },
      raw: text,
    };
  } catch (err) {
    return { ok: false, error: 'Failed to parse OpenAI JSON', raw: text, parseError: String(err) };
  }
};

const safeParseModelText = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'Empty OpenAI response', raw: text };
  }

  const normalized = text.replace(/\r\n/g, '\n');

  const frameworkMatch = normalized.match(/^\s*FRAMEWORK:\s*(.+?)\s*$/im);
  const captionMatch = normalized.match(/^\s*Caption:\s*\n([\s\S]*?)\n\s*CTA:\s*/im);
  const ctaMatch = normalized.match(/^\s*CTA:\s*(.+?)\s*$/im);
  const hashtagsMatch = normalized.match(/^\s*Hashtags:\s*([\s\S]+?)\s*$/im);

  if (!frameworkMatch || !captionMatch || !ctaMatch || !hashtagsMatch) {
    return { ok: false, error: 'Missing required labeled sections', raw: text };
  }

  const frameworkRaw = String(frameworkMatch[1] || '').trim();
  const framework = frameworkRaw.toUpperCase();
  if (!ALLOWED_FRAMEWORKS.has(framework)) {
    return { ok: false, error: `Invalid framework: ${frameworkRaw || '(missing)'}`, raw: text };
  }

  const caption = String(captionMatch[1] || '').trim();
  const cta = String(ctaMatch[1] || '').trim();
  const hashtagsRaw = String(hashtagsMatch[1] || '').trim();
  const hashtags = hashtagsRaw
    .split(/\s+/)
    .map((h) => h.trim())
    .filter(Boolean)
    .filter((h) => h.startsWith('#'));

  if (hashtags.length === 0) {
    return { ok: false, error: 'Missing hashtags', raw: text };
  }

  return {
    ok: true,
    value: {
      framework,
      caption,
      cta,
      hashtags,
    },
    raw: text,
  };
};

const callOpenAIForCaption = async ({ systemPrompt, userPrompt }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Missing OPENAI_API_KEY' };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const postChatCompletions = async (body) => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text().catch(() => '');
    return { res, raw };
  };

  const baseBody = {
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt || '' },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  };

  let { res, raw } = await postChatCompletions(baseBody);

  if (!res.ok && res.status === 400) {
    const retryBody = { ...baseBody };
    delete retryBody.response_format;
    ({ res, raw } = await postChatCompletions(retryBody));
  }

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

const assertUserCanAccessCompany = async ({ userId, companyId }) => {
  const { data: company, error } = await db
    .from('company')
    .select('user_id, collaborator_ids, companyName')
    .eq('companyId', companyId)
    .single();

  if (error || !company) {
    return { ok: false, status: 404, error: 'Company not found' };
  }

  if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  // Fetch user metadata for triggeredByName
  const { data: { user }, error: userError } = await db.auth.admin.getUserById(userId);
  const triggeredByName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email || 'Unknown User';

  return { ok: true, companyName: company.companyName, triggeredByName };
};

export async function generateCaptionForContent(contentCalendarId, opts = {}) {
  const userId = opts.userId;
  if (!contentCalendarId) {
    return { ok: false, status: 400, error: 'contentCalendarId is required' };
  }
  if (!userId) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const { data: contentCalendar, error: rowError } = await db
    .from('contentCalendar')
    .select('*')
    .eq('contentCalendarId', contentCalendarId)
    .single();

  if (rowError || !contentCalendar) {
    return { ok: false, status: 404, error: 'Content calendar entry not found' };
  }

  const companyId = contentCalendar.companyId;
  if (!companyId) {
    return { ok: false, status: 400, error: 'Content calendar row missing companyId' };
  }

  const auth = await assertUserCanAccessCompany({ userId, companyId });
  if (!auth.ok) return auth;

  const companyName = auth.companyName;
  const triggeredByName = auth.triggeredByName;

  const normalized = normalizeStatusState(contentCalendar.status);
  const state = String(normalized.state || 'Draft');

  if (state === 'Generating') {
    return { ok: false, status: 409, error: 'Generation already running', code: 'ALREADY_GENERATING' };
  }
  const generationAllowed = ['Draft', 'Error', 'Generate', 'Review', 'Approved', 'Needs Revision'].includes(state);
  if (!generationAllowed) {
    return { ok: false, status: 409, error: `Generation blocked for status: ${state}`, code: 'STATUS_BLOCKED' };
  }

  const { error: setGeneratingError } = await db
    .from('contentCalendar')
    .update({ status: writeStatus('Generating') })
    .eq('contentCalendarId', contentCalendarId);

  if (setGeneratingError) {
    return { ok: false, status: 500, error: 'Failed to set Generating status' };
  }

  const { data: brandKB, error: brandError } = await db
    .from('brandKB')
    .select('brandPack, brandCapability, writerAgent, emojiRule, companyId')
    .eq('companyId', companyId)
    .limit(1)
    .maybeSingle();

  if (brandError) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: brandError.message || 'Failed to load brandKB' }),
        reviewNotes: brandError.message || 'Failed to load brandKB',
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: 'Failed to load brandKB' };
  }

  const userPrompt = buildUserPrompt({ contentCalendar, brandKB });
  const openAiRes = await callOpenAIForCaption({
    systemPrompt: brandKB?.writerAgent ?? '',
    userPrompt,
  });

  if (!openAiRes.ok) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: openAiRes.error }),
        reviewNotes: openAiRes.raw ? String(openAiRes.raw).slice(0, 4000) : openAiRes.error,
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: openAiRes.error };
  }

  const parsed = safeParseModelJson(openAiRes.content);
  const parsedAny = parsed.ok ? parsed : safeParseModelText(openAiRes.content);
  if (!parsedAny.ok) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: parsedAny.error }),
        reviewNotes: String(parsedAny.raw || '').slice(0, 4000),
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: parsedAny.error };
  }

  const { framework, caption, cta, hashtags } = parsedAny.value;
  const hashtagsJoined = hashtags.join(' ');

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      frameworkUsed: framework,
      captionOutput: caption,
      ctaOuput: cta,
      hastagsOutput: hashtagsJoined,
      status: writeStatus('Review'),
      reviewNotes: null,
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: saveError.message || 'Failed to save caption outputs' }),
        reviewNotes: saveError.message || 'Failed to save caption outputs',
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: 'Failed to save caption outputs' };
  }

  const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

  if (updated) {
    await sendNotification({
      userId,
      title: 'Caption Generated',
      message: `Caption generated for ${contentCalendar.theme || 'New Content'}`,
      type: 'success',
      link: '/calendar', // Or deep link to the item
      triggeredByName,
      companyName,
    });
  }

  return {
    ok: true,
    status: 200,
    result: {
      framework,
      caption,
      cta,
      hashtags,
    },
    contentCalendar: updated,
  };
}

export async function generateCaptionForContentSystem(payload = {}) {
  const { contentCalendarId, companyId: companyIdFromWebhook, status: statusFromWebhook } = payload || {};

  if (!contentCalendarId || typeof contentCalendarId !== 'string' || !contentCalendarId.trim()) {
    return { ok: false, status: 400, error: 'contentCalendarId is required' };
  }

  const { data: contentCalendar, error: rowError } = await db
    .from('contentCalendar')
    .select('*')
    .eq('contentCalendarId', contentCalendarId)
    .single();

  if (rowError || !contentCalendar) {
    return { ok: false, status: 404, error: 'Content calendar entry not found' };
  }

  const companyId = contentCalendar.companyId;
  if (!companyId) {
    return { ok: false, status: 400, error: 'Content calendar row missing companyId' };
  }

  if (
    typeof companyIdFromWebhook === 'string' &&
    companyIdFromWebhook.trim() &&
    companyIdFromWebhook.trim() !== companyId
  ) {
    return { ok: false, status: 409, error: 'Webhook companyId does not match contentCalendar row' };
  }

  const stateFromRow = String(normalizeStatusState(contentCalendar.status).state || 'Draft');
  const stateFromWebhook = statusFromWebhook != null ? String(normalizeStatusState(statusFromWebhook).state || '') : '';
  const effectiveState = stateFromWebhook || stateFromRow;

  if (effectiveState === 'Generating') {
    return { ok: false, status: 409, error: 'Generation already running', code: 'ALREADY_GENERATING' };
  }
  const generationAllowed = ['Draft', 'Error', 'Generate', 'Review', 'Approved', 'Needs Revision'].includes(effectiveState);
  if (!generationAllowed) {
    return {
      ok: false,
      status: 409,
      error: `Generation blocked for status: ${effectiveState}`,
      code: 'STATUS_BLOCKED',
    };
  }

  const { error: setGeneratingError } = await db
    .from('contentCalendar')
    .update({ status: writeStatus('Generating') })
    .eq('contentCalendarId', contentCalendarId);

  if (setGeneratingError) {
    return { ok: false, status: 500, error: 'Failed to set Generating status' };
  }

  const { data: brandKB, error: brandError } = await db
    .from('brandKB')
    .select('brandPack, brandCapability, writerAgent, emojiRule, companyId')
    .eq('companyId', companyId)
    .limit(1)
    .maybeSingle();

  if (brandError) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: brandError.message || 'Failed to load brandKB' }),
        reviewNotes: brandError.message || 'Failed to load brandKB',
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: 'Failed to load brandKB' };
  }

  const userPrompt = buildUserPrompt({ contentCalendar, brandKB });
  const openAiRes = await callOpenAIForCaption({
    systemPrompt: brandKB?.writerAgent ?? '',
    userPrompt,
  });

  if (!openAiRes.ok) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: openAiRes.error }),
        reviewNotes: openAiRes.raw ? String(openAiRes.raw).slice(0, 4000) : openAiRes.error,
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: openAiRes.error };
  }

  const parsed = safeParseModelJson(openAiRes.content);
  const parsedAny = parsed.ok ? parsed : safeParseModelText(openAiRes.content);
  if (!parsedAny.ok) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: parsedAny.error }),
        reviewNotes: String(parsedAny.raw || '').slice(0, 4000),
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: parsedAny.error };
  }

  const { framework, caption, cta, hashtags } = parsedAny.value;
  const hashtagsJoined = hashtags.join(' ');

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      frameworkUsed: framework,
      captionOutput: caption,
      ctaOuput: cta,
      hastagsOutput: hashtagsJoined,
      status: writeStatus('Review'),
      reviewNotes: null,
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: saveError.message || 'Failed to save caption outputs' }),
        reviewNotes: saveError.message || 'Failed to save caption outputs',
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: 'Failed to save caption outputs' };
  }

  const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

  return {
    ok: true,
    status: 200,
    result: {
      framework,
      caption,
      cta,
      hashtags,
    },
    contentCalendar: updated,
  };
}

export async function generateCaptionsBulk(contentCalendarIds, opts = {}) {
  const userId = opts.userId;
  if (!userId) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  if (!Array.isArray(contentCalendarIds)) {
    return { ok: false, status: 400, error: 'contentCalendarIds must be an array' };
  }

  const ids = contentCalendarIds.filter((id) => typeof id === 'string' && id.trim());
  if (ids.length === 0) {
    return { ok: false, status: 400, error: 'contentCalendarIds must be a non-empty array' };
  }

  if (ids.length > 50) {
    return { ok: false, status: 400, error: 'Max 50 IDs per request' };
  }

  const summary = {
    success: [],
    failed: [],
    skipped: [],
  };

  for (const id of ids) {
    try {
      const res = await generateCaptionForContent(id, { userId });
      if (res.ok) {
        summary.success.push(id);
      } else if (res.status === 409) {
        summary.skipped.push({ id, reason: res.code || res.error });
      } else {
        summary.failed.push({ id, error: res.error });
      }
    } catch (err) {
      summary.failed.push({ id, error: String(err) });
    }
  }

  return { ok: true, status: 200, summary };
}
