import db from '../database/db.js';

import { REVIEW_USER_PROMPT_TEMPLATE } from './prompts.js';

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

const assertUserCanAccessCompany = async ({ userId, companyId, requiredPermission = null }) => {
  const { data: company, error } = await db
    .from('company')
    .select('user_id, collaborator_ids, custom_roles, collaborator_roles')
    .eq('companyId', companyId)
    .single();

  if (error || !company) {
    return { ok: false, status: 404, error: 'Company not found' };
  }

  // Owner check
  if (company.user_id === userId) {
    // Proceed
  } else if (!(company.collaborator_ids?.includes(userId))) {
    return { ok: false, status: 403, error: 'Forbidden' };
  } else if (requiredPermission) {
    // Permission check for collaborator
    const userRoleName = company.collaborator_roles?.[userId];
    if (userRoleName) {
      const roleDef = company.custom_roles?.find(r => r.name === userRoleName);
      if (roleDef && roleDef.permissions && roleDef.permissions[requiredPermission] === false) {
        return { ok: false, status: 403, error: `Member lacks '${requiredPermission}' permission.` };
      }
    }
  }

  return { ok: true };
};

const safeParseReviewerJson = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'Empty OpenAI response', raw: text };
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'OpenAI response is not a JSON object', raw: text };
    }

    const decisionRaw = typeof parsed.decision === 'string' ? parsed.decision.trim() : '';
    const reviewNotes = typeof parsed.reviewNotes === 'string' ? parsed.reviewNotes : '';
    const finalCaption = typeof parsed.finalCaption === 'string' ? parsed.finalCaption : '';
    const finalCTA = typeof parsed.finalCTA === 'string' ? parsed.finalCTA : '';
    const finalHashtags = typeof parsed.finalHashtags === 'string' ? parsed.finalHashtags : '';

    const decisionUpper = decisionRaw.toUpperCase();
    const isApproved = decisionUpper.includes('APPROVE');
    const isNeedsRevision = decisionUpper.includes('NEEDS') && decisionUpper.includes('REVISION');

    if (!isApproved && !isNeedsRevision) {
      return { ok: false, error: `Invalid decision: ${decisionRaw || '(missing)'}`, raw: text };
    }

    return {
      ok: true,
      value: {
        decision: isNeedsRevision ? 'NEEDS REVISION' : 'APPROVED',
        reviewNotes,
        finalCaption,
        finalCTA,
        finalHashtags,
      },
      raw: text,
    };
  } catch (err) {
    return { ok: false, error: 'Failed to parse OpenAI JSON', raw: text, parseError: String(err) };
  }
};

const safeParseReviewerText = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'Empty OpenAI response', raw: text };
  }

  const normalized = text.replace(/\r\n/g, '\n');

  const decisionMatch = normalized.match(/^\s*DECISION:\s*(.+?)\s*$/im);
  if (!decisionMatch) {
    return { ok: false, error: 'Missing DECISION section', raw: text };
  }

  const decisionRaw = String(decisionMatch[1] || '').trim();
  const decisionUpper = decisionRaw.toUpperCase();
  const isApproved = decisionUpper.includes('APPROVE');
  const isNeedsRevision = decisionUpper.includes('NEEDS') && decisionUpper.includes('REVISION');

  if (!isApproved && !isNeedsRevision) {
    return { ok: false, error: `Invalid decision: ${decisionRaw || '(missing)'}`, raw: text };
  }

  const extractBetween = (startLabel, endLabel) => {
    // Escape the label for regex use and allow for optional markdown # symbols and optional trailing colon
    const labelPattern = startLabel.replace(/:$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startRegex = new RegExp(`^\\s*(?:#+\\s*)?${labelPattern}:?\\s*`, 'im');

    const startMatch = normalized.match(startRegex);
    if (!startMatch) return '';

    const startIdx = startMatch.index;
    const afterStart = normalized.slice(startIdx + startMatch[0].length);

    if (!endLabel) return afterStart.trim();

    const endLabelPattern = endLabel.replace(/:$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const endRegex = new RegExp(`^\\s*(?:#+\\s*)?${endLabelPattern}:?\\s*`, 'im');

    const endMatch = afterStart.match(endRegex);
    if (!endMatch) return afterStart.trim();

    return afterStart.slice(0, endMatch.index).trim();
  };

  const notesBlock = extractBetween('NOTES', 'FINAL CAPTION');
  const finalCaption = extractBetween('FINAL CAPTION', 'FINAL CTA');
  const finalCTA = extractBetween('FINAL CTA', 'FINAL HASHTAGS');
  const finalHashtags = extractBetween('FINAL HASHTAGS', null);

  const reviewNotes = notesBlock
    ? notesBlock
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n')
    : '';

  return {
    ok: true,
    value: {
      decision: isNeedsRevision ? 'NEEDS REVISION' : 'APPROVED',
      reviewNotes,
      finalCaption,
      finalCTA,
      finalHashtags,
    },
    raw: text,
  };
};

const buildReviewerUserPrompt = ({ contentCalendar, brandKB }) => {
  const channelsValue = Array.isArray(contentCalendar.channels)
    ? contentCalendar.channels.join(', ')
    : contentCalendar.channels ?? '';

  return REVIEW_USER_PROMPT_TEMPLATE
    .replaceAll('{{captionOutput}}', contentCalendar.captionOutput ?? '')
    .replaceAll('{{ctaOuput}}', contentCalendar.ctaOuput ?? '')
    .replaceAll('{{hastagsOutput}}', contentCalendar.hastagsOutput ?? '')
    .replaceAll('{{channels}}', channelsValue)
    .replaceAll('{{primaryGoal}}', contentCalendar.primaryGoal ?? '')
    .replaceAll('{{brandPack}}', brandKB?.brandPack ?? '')
    .replaceAll('{{brandCapability}}', brandKB?.brandCapability ?? '')
    .replaceAll('{{emojiRule}}', (() => {
      const rule = (brandKB?.emojiRule || '').trim();
      if (!rule) return '';
      if (rule.match(/^None$/i)) return 'Do NOT use emojis.';
      if (rule.match(/^Light$/i)) return 'Use at most 1-2 relevant emojis, placed at the end of the caption. Keep it professional.';
      if (rule.match(/^Medium$/i)) return 'Use 3-5 emojis to add personality. You may use them to emphasize key points or at the end of paragraphs.';
      if (rule.match(/^Heavy$/i)) return 'Use emojis frequently (5+) to make the caption fun and engaging. Use them inline and at the end.';
      return rule;
    })());
};

const callOpenAIForReview = async ({ systemPrompt, userPrompt }) => {
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
    temperature: 0.4,
    messages: [
      { role: 'system', content: systemPrompt || '' },
      { role: 'user', content: userPrompt },
    ],
  };

  let { res, raw } = await postChatCompletions(baseBody);

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

export async function reviewContentForCalendarRow(contentCalendarId, opts = {}) {
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

  const auth = await assertUserCanAccessCompany({ userId, companyId, requiredPermission: 'canGenerate' });
  if (!auth.ok) return auth;

  const state = String(normalizeStatusState(contentCalendar.status).state || 'Draft');

  if (state === 'Reviewing') {
    return { ok: false, status: 409, error: 'Review already running', code: 'ALREADY_REVIEWING' };
  }

  const reviewAllowed = ['Review', 'Ready', 'Needs Revision'].includes(state);
  if (!reviewAllowed) {
    return { ok: false, status: 409, error: `Review blocked for status: ${state}`, code: 'STATUS_BLOCKED' };
  }

  if (!contentCalendar.captionOutput || !String(contentCalendar.captionOutput).trim()) {
    return { ok: false, status: 409, error: 'Missing captionOutput for review', code: 'MISSING_CAPTION' };
  }

  const { error: setReviewingError } = await db
    .from('contentCalendar')
    .update({ status: writeStatus('Reviewing') })
    .eq('contentCalendarId', contentCalendarId);

  if (setReviewingError) {
    return { ok: false, status: 500, error: 'Failed to set Reviewing status' };
  }

  const { data: brandKB, error: brandError } = await db
    .from('brandKB')
    .select('brandPack, brandCapability, writerAgent, reviewPrompt1, emojiRule, companyId')
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

  const userPrompt = buildReviewerUserPrompt({ contentCalendar, brandKB });

  const openAiRes = await callOpenAIForReview({
    systemPrompt: brandKB?.reviewPrompt1 || brandKB?.writerAgent || '',
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

  const parsed = safeParseReviewerJson(openAiRes.content);
  const parsedText = parsed.ok ? parsed : safeParseReviewerText(openAiRes.content);
  if (!parsedText.ok) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: parsedText.error }),
        reviewNotes: String(parsedText.raw || '').slice(0, 4000),
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: parsedText.error };
  }

  const { decision, reviewNotes, finalCaption, finalCTA, finalHashtags } = parsedText.value;
  const nextStatus = decision === 'NEEDS REVISION' ? 'Needs Revision' : 'Ready';

  // Fallback to drafts if the reviewer failed to output mandatory sections
  const safeCaption = (finalCaption && String(finalCaption).trim()) ? finalCaption : (contentCalendar.captionOutput || '');
  const safeCTA = (finalCTA && String(finalCTA).trim()) ? finalCTA : (contentCalendar.ctaOuput || '');
  const safeHashtags = (finalHashtags && String(finalHashtags).trim()) ? finalHashtags : (contentCalendar.hastagsOutput || '');

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      reviewDecision: decision,
      reviewNotes: reviewNotes || null,
      finalCaption: safeCaption || null,
      finalCTA: safeCTA || null,
      finalHashtags: safeHashtags || null,
      status: writeStatus(nextStatus),
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: saveError.message || 'Failed to save review outputs' }),
        reviewNotes: saveError.message || 'Failed to save review outputs',
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: 'Failed to save review outputs' };
  }

  const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

  return {
    ok: true,
    status: 200,
    result: parsedText.value,
    contentCalendar: updated,
  };
}

export async function reviewContentForCalendarRowSystem(payload = {}) {
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

  if (effectiveState === 'Reviewing') {
    return { ok: false, status: 409, error: 'Review already running', code: 'ALREADY_REVIEWING' };
  }

  const reviewAllowed = ['Review', 'Ready', 'Needs Revision'].includes(effectiveState);
  if (!reviewAllowed) {
    return { ok: false, status: 409, error: `Review blocked for status: ${effectiveState}`, code: 'STATUS_BLOCKED' };
  }

  if (!contentCalendar.captionOutput || !String(contentCalendar.captionOutput).trim()) {
    return { ok: false, status: 409, error: 'Missing captionOutput for review', code: 'MISSING_CAPTION' };
  }

  const { error: setReviewingError } = await db
    .from('contentCalendar')
    .update({ status: writeStatus('Reviewing') })
    .eq('contentCalendarId', contentCalendarId);

  if (setReviewingError) {
    return { ok: false, status: 500, error: 'Failed to set Reviewing status' };
  }

  const { data: brandKB, error: brandError } = await db
    .from('brandKB')
    .select('brandPack, brandCapability, writerAgent, reviewPrompt1, emojiRule, companyId')
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

  const userPrompt = buildReviewerUserPrompt({ contentCalendar, brandKB });

  const openAiRes = await callOpenAIForReview({
    systemPrompt: brandKB?.reviewPrompt1 || brandKB?.writerAgent || '',
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

  const parsed = safeParseReviewerJson(openAiRes.content);
  const parsedText = parsed.ok ? parsed : safeParseReviewerText(openAiRes.content);
  if (!parsedText.ok) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: parsedText.error }),
        reviewNotes: String(parsedText.raw || '').slice(0, 4000),
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: parsedText.error };
  }

  const { decision, reviewNotes, finalCaption, finalCTA, finalHashtags } = parsedText.value;
  const nextStatus = decision === 'NEEDS REVISION' ? 'Needs Revision' : 'Ready';

  // Fallback to drafts if the reviewer failed to output mandatory sections
  const safeCaption = (finalCaption && String(finalCaption).trim()) ? finalCaption : (contentCalendar.captionOutput || '');
  const safeCTA = (finalCTA && String(finalCTA).trim()) ? finalCTA : (contentCalendar.ctaOuput || '');
  const safeHashtags = (finalHashtags && String(finalHashtags).trim()) ? finalHashtags : (contentCalendar.hastagsOutput || '');

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      reviewDecision: decision,
      reviewNotes: reviewNotes || null,
      finalCaption: safeCaption || null,
      finalCTA: safeCTA || null,
      finalHashtags: safeHashtags || null,
      status: writeStatus(nextStatus),
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    await db
      .from('contentCalendar')
      .update({
        status: writeStatus('Error', { message: saveError.message || 'Failed to save review outputs' }),
        reviewNotes: saveError.message || 'Failed to save review outputs',
      })
      .eq('contentCalendarId', contentCalendarId);

    return { ok: false, status: 500, error: 'Failed to save review outputs' };
  }

  const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

  return {
    ok: true,
    status: 200,
    result: parsedText.value,
    contentCalendar: updated,
  };
}

export async function reviewContentBulk(contentCalendarIds, opts = {}) {
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
      const res = await reviewContentForCalendarRow(id, { userId });
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
