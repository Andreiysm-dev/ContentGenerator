import db from '../database/db.js';

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

const assertUserCanAccessCompany = async ({ userId, companyId }) => {
  const { data: company, error } = await db
    .from('company')
    .select('user_id, collaborator_ids')
    .eq('companyId', companyId)
    .single();

  if (error || !company) {
    return { ok: false, status: 404, error: 'Company not found' };
  }

  if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
    return { ok: false, status: 403, error: 'Forbidden' };
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
    const startRe = new RegExp(`^\\s*${startLabel}\\s*$`, 'im');
    const endRe = endLabel ? new RegExp(`^\\s*${endLabel}\\s*$`, 'im') : null;
    const start = normalized.search(startRe);
    if (start === -1) return '';
    const afterStart = normalized.slice(start).replace(startRe, '');
    if (!endRe) return afterStart.trim();
    const endIndex = afterStart.search(endRe);
    if (endIndex === -1) return afterStart.trim();
    return afterStart.slice(0, endIndex).trim();
  };

  const notesBlock = extractBetween('NOTES:', 'FINAL CAPTION:');
  const finalCaption = extractBetween('FINAL CAPTION:', 'FINAL CTA:');
  const finalCTA = extractBetween('FINAL CTA:', 'FINAL HASHTAGS:');
  const finalHashtags = extractBetween('FINAL HASHTAGS:', null);

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

  return [
    'You are reviewing content',
    '',
    'Inputs',
    '',
    `Draft Caption:${contentCalendar.captionOutput ?? ''}`,
    '',
    `Draft CTA:${contentCalendar.ctaOuput ?? ''}`,
    '',
    `Draft Hashtags:${contentCalendar.hastagsOutput ?? ''}`,
    '',
    `Channel:${channelsValue}`,
    '',
    `Primary Goal:${contentCalendar.primaryGoal ?? ''}`,
    '',
    `Brand Pack:${brandKB?.brandPack ?? ''}`,
    '',
    `Capability Map:${brandKB?.brandCapability ?? ''}`,
    '',
    'Instructions',
    '',
    'Review the draft for brand alignment, clarity, and compliance',
    'Simplify language where needed',
    'Remove or replace any forbidden words or risky claims',
    'Ensure tone matches the channel and audience',
    'Fix the content directly if possible',
    'If you can fully correct the content to be compliant and on-brand, you MUST mark APPROVED even if you made changes.',
    'NEEDS REVISION is ONLY allowed when you require specific human input (missing facts, unclear offer details, legal/compliance uncertainty that cannot be safely removed).',
    'If you choose NEEDS REVISION, NOTES MUST include a bullet that starts with: HUMAN INPUT REQUIRED: <question(s) or missing info>',
    'If you mark NEEDS REVISION, you MUST still revise the content yourself and provide corrected final outputs.',
    'If you mark NEEDS REVISION, NOTES must include a clear list of the specific changes you made (what you changed and why).',
    'Only mark NEEDS REVISION if the content still has material issues that require human input even after your best corrections.',
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
    'Do not include anything else.',
  ].join('\n');
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

  const auth = await assertUserCanAccessCompany({ userId, companyId });
  if (!auth.ok) return auth;

  const state = String(normalizeStatusState(contentCalendar.status).state || 'Draft');

  if (state === 'Reviewing') {
    return { ok: false, status: 409, error: 'Review already running', code: 'ALREADY_REVIEWING' };
  }

  const reviewAllowed = state === 'Review';
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
  const nextStatus = decision === 'NEEDS REVISION' ? 'Needs Revision' : 'Approved';

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      reviewDecision: decision,
      reviewNotes: reviewNotes || null,
      finalCaption: finalCaption || null,
      finalCTA: finalCTA || null,
      finalHashtags: finalHashtags || null,
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

  const reviewAllowed = effectiveState === 'Review';
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
  const nextStatus = decision === 'NEEDS REVISION' ? 'Needs Revision' : 'Approved';

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      reviewDecision: decision,
      reviewNotes: reviewNotes || null,
      finalCaption: finalCaption || null,
      finalCTA: finalCTA || null,
      finalHashtags: finalHashtags || null,
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
