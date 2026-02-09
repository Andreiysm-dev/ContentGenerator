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

const parseMegaPromptBlock = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'Empty megaprompt response', raw: text };
  }

  const normalized = text.replace(/\r\n/g, '\n');
  const megaMatch = normalized.match(/^\s*MEGAPROMPT:\s*\n?([\s\S]*?)\n\s*NEGATIVE:\s*/im);
  const negMatch = normalized.match(/^\s*NEGATIVE:\s*\n?([\s\S]*?)\s*$/im);

  if (!megaMatch || !negMatch) {
    return { ok: false, error: 'Megaprompt output missing MEGAPROMPT/NEGATIVE sections', raw: text };
  }

  const mega = String(megaMatch[1] || '').trim();
  const negative = String(negMatch[1] || '').trim();

  if (!mega) {
    return { ok: false, error: 'Megaprompt section is empty', raw: text };
  }

  return { ok: true, value: { mega, negative }, raw: text };
};

const callImagenPredict = async ({ model, prompt, aspectRatio = '1:1', personGeneration = 'allow_adult' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Missing GEMINI_API_KEY' };
  }


  // Official Gemini Imagen REST API endpoint (uses :predict, not :generateImages)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict`;


  // Official API format: instances array with parameters object
  const body = {
    instances: [
      {
        prompt: prompt
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectRatio,
      personGeneration: personGeneration,
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    const detail = typeof raw === 'string' && raw.trim() ? `: ${raw.slice(0, 800)}` : '';
    return { ok: false, error: `Imagen error ${res.status}${detail}`, raw };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Imagen returned non-JSON response', raw };
  }

  // API returns predictions array
  const predictions = Array.isArray(data?.predictions) ? data.predictions : [];
  const first = predictions[0] || null;

  // Try multiple possible field names for the base64 image data
  const base64 =
    (typeof first?.bytesBase64Encoded === 'string' && first.bytesBase64Encoded) ||
    (typeof first?.image?.bytesBase64Encoded === 'string' && first.image.bytesBase64Encoded) ||
    (typeof first?.imageBytes === 'string' && first.imageBytes) ||
    (typeof first?.image?.imageBytes === 'string' && first.image.imageBytes) ||
    null;

  if (!base64) {
    return { ok: false, error: 'Imagen response missing image bytes', raw: data };
  }

  return { ok: true, base64, raw: data };
};

const uploadGeneratedImage = async ({ companyId, contentCalendarId, imageBytes, extension = 'png' }) => {
  const bucket = 'generated-images';
  const fileName = `imagen-${Date.now()}.${extension}`;
  const path = `${companyId}/${contentCalendarId}/${fileName}`;

  const { data, error } = await db.storage
    .from(bucket)
    .upload(path, imageBytes, { upsert: true, contentType: `image/${extension}` });

  if (error) {
    return { ok: false, error: error.message || 'Failed to upload image', raw: error };
  }

  return { ok: true, path: data?.path || path };
};

const loadContentCalendarRow = async ({ contentCalendarId, userId }) => {
  const { data: row, error } = await db
    .from('contentCalendar')
    .select('*')
    .eq('contentCalendarId', contentCalendarId)
    .single();

  if (error || !row) {
    return { ok: false, status: 404, error: 'Content calendar entry not found' };
  }

  const { data: company, error: companyError } = await db
    .from('company')
    .select('user_id, collaborator_ids')
    .eq('companyId', row.companyId)
    .single();

  if (companyError || !company) {
    return { ok: false, status: 404, error: 'Company not found' };
  }

  if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, row };
};

export async function generateImageForCalendarRow(contentCalendarId, opts = {}) {
  const userId = opts.userId;
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  const loaded = await loadContentCalendarRow({ contentCalendarId, userId });
  if (!loaded.ok) return loaded;

  const row = loaded.row;

  const { data: brandKB, error: brandError } = await db
    .from('brandKB')
    .select('systemInstruction, companyId')
    .eq('companyId', row.companyId)
    .limit(1)
    .maybeSingle();

  if (brandError) {
    return { ok: false, status: 500, error: 'Failed to load brandKB' };
  }

  const systemInstruction =
    (typeof opts.systemInstruction === 'string' && opts.systemInstruction.trim())
      ? opts.systemInstruction
      : (brandKB?.systemInstruction ?? '');

  const openAiSystem =
    'You are an expert prompt engineer specializing in text-to-image generation for Gemini.\n\nYour task is to generate ONE (1) production-ready IMAGE MEGAPROMPT that will be sent directly to Gemini for image generation.\n\nYou MUST strictly follow the provided brand system instruction. The brand system instruction defines the visual identity, tone, and design boundaries and OVERRIDES all other creative decisions.\n\n---\n\nBRAND SYSTEM INSTRUCTION (MANDATORY):\n{{SYSTEM_INSTRUCTION}}\n\nDo not introduce visual styles, colors, typography, layouts, moods, or imagery that are not aligned with or implied by the brand system instruction.\n\n---\n\nOBJECTIVE:\nCreate a visually clear, on-brand social media image concept that:\n- Prioritizes the Brand Highlight as the dominant visual message\n- Supports Cross Promotion as a secondary element without competing for attention\n- Is optimized for social media feeds and small-screen readability\n- Fully aligns with the provided brand system instruction\n\n---\n\nOUTPUT FORMAT (STRICT — FOLLOW EXACTLY):\n\nMEGAPROMPT:\n<Write ONE cohesive paragraph describing the image to be generated. \nInclude visual style, composition, layout hierarchy, color treatment, subject matter, mood, and brand alignment.\nDescribe how text, imagery, and CTA are visually organized without inventing copy unless necessary.>\n\nNEGATIVE:\n<Write ONE cohesive paragraph listing what the image must avoid, including off-brand styles, conflicting tones, cluttered layouts, poor readability, unrealistic visuals, decorative fonts, experimental art styles, or anything that violates the brand system instruction.>\n\n---\n\nHARD RULES:\n- Output ONLY the MEGAPROMPT and NEGATIVE sections.\n- Do NOT include explanations, bullet points, headings, markdown, or commentary.\n- Do NOT generate multiple concepts or variations.\n- Do NOT invent logos, colors, typography, or brand elements.\n- Do NOT restate the brand system instruction.';

  const openAiUser =
    'Create a social media post image using the following context. \nUse only what is visually relevant and prioritize clarity, hierarchy, and brand alignment.\n\nPost Caption:\n{{FINAL_CAPTION}}\n\nBrand Highlight (Primary focus – ~80% visual emphasis):\n{{BRAND_HIGHLIGHT}}\n\nCross Promotion (Secondary focus – ~20% visual emphasis):\n{{CROSS_PROMO}}\n\nTheme:\n{{THEME}}\n\nCall To Action (CTA):\n{{CTA}}\n\nTarget Audience:\n{{TARGET_AUDIENCE}}\n';

  const openAiRes = await callOpenAIText({
    systemPrompt: openAiSystem.replaceAll('{{SYSTEM_INSTRUCTION}}', systemInstruction || ''),
    userPrompt: openAiUser
      .replaceAll('{{FINAL_CAPTION}}', String(row.finalCaption ?? ''))
      .replaceAll('{{BRAND_HIGHLIGHT}}', String(row.brandHighlight ?? ''))
      .replaceAll('{{CROSS_PROMO}}', String(row.crossPromo ?? ''))
      .replaceAll('{{THEME}}', String(row.theme ?? ''))
      .replaceAll('{{CTA}}', String(row.cta ?? ''))
      .replaceAll('{{TARGET_AUDIENCE}}', String(row.targetAudience ?? '')),
    temperature: 1,
  });

  if (!openAiRes.ok) {
    return { ok: false, status: 500, error: openAiRes.error };
  }

  const dmpRaw = (openAiRes.content || '').trim();

  const { error: saveDmpError } = await db
    .from('contentCalendar')
    .update({ dmp: dmpRaw })
    .eq('contentCalendarId', contentCalendarId);

  if (saveDmpError) {
    return { ok: false, status: 500, error: 'Failed to save DMP' };
  }

  const parsed = parseMegaPromptBlock(dmpRaw);
  if (!parsed.ok) {
    return { ok: false, status: 500, error: parsed.error };
  }

  const { mega, negative } = parsed.value;
  const fullPrompt = negative ? `${mega}\n\nNEGATIVE: ${negative}` : mega;

  // Use Imagen 4.0 (Imagen 3 has been shut down)
  const imageModel = process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001';
  console.log('[Image Generation] Calling Gemini Imagen API with model:', imageModel);
  console.log('[Image Generation] Prompt length:', fullPrompt.length);

  const imagenRes = await callImagenPredict({
    model: imageModel,
    prompt: fullPrompt,
    aspectRatio: '1:1',
    personGeneration: 'allow_adult',
  });

  if (!imagenRes.ok) {
    console.error('[Image Generation] Gemini API error:', imagenRes.error);
    console.error('[Image Generation] Raw response:', JSON.stringify(imagenRes.raw).slice(0, 500));
    return { ok: false, status: 500, error: imagenRes.error };
  }

  console.log('[Image Generation] Gemini API success, image received');

  const bytes = Buffer.from(imagenRes.base64, 'base64');
  const uploadRes = await uploadGeneratedImage({
    companyId: row.companyId,
    contentCalendarId,
    imageBytes: bytes,
    extension: 'png',
  });

  if (!uploadRes.ok) {
    return { ok: false, status: 500, error: uploadRes.error };
  }

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      status: 'Design Completed',
      imageGenerated: uploadRes.path,
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    return { ok: false, status: 500, error: 'Failed to save image output' };
  }

  return {
    ok: true,
    status: 200,
    contentCalendar: Array.isArray(updatedRows) ? updatedRows[0] : null,
    result: {
      dmp: dmpRaw,
      imageGenerated: uploadRes.path,
    },
  };
}

export async function generateImageFromCustomDmp(contentCalendarId, dmp, opts = {}) {
  const userId = opts.userId;
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  if (typeof dmp !== 'string' || !dmp.trim()) {
    return { ok: false, status: 400, error: 'dmp is required' };
  }

  const loaded = await loadContentCalendarRow({ contentCalendarId, userId });
  if (!loaded.ok) return loaded;

  const row = loaded.row;

  const { error: saveDmpError } = await db
    .from('contentCalendar')
    .update({ dmp: dmp.trim() })
    .eq('contentCalendarId', contentCalendarId);

  if (saveDmpError) {
    return { ok: false, status: 500, error: 'Failed to save DMP' };
  }

  const imageModel = process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001';
  const imagenRes = await callImagenPredict({
    model: imageModel,
    prompt: dmp.trim(),
    aspectRatio: '1:1',
    personGeneration: 'allow_adult',
  });

  if (!imagenRes.ok) {
    return { ok: false, status: 500, error: imagenRes.error };
  }

  const bytes = Buffer.from(imagenRes.base64, 'base64');
  const uploadRes = await uploadGeneratedImage({
    companyId: row.companyId,
    contentCalendarId,
    imageBytes: bytes,
    extension: 'png',
  });

  if (!uploadRes.ok) {
    return { ok: false, status: 500, error: uploadRes.error };
  }

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      status: 'Design Completed',
      imageGenerated: uploadRes.path,
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    return { ok: false, status: 500, error: 'Failed to save image output' };
  }

  return {
    ok: true,
    status: 200,
    contentCalendar: Array.isArray(updatedRows) ? updatedRows[0] : null,
    result: {
      dmp: dmp.trim(),
      imageGenerated: uploadRes.path,
    },
  };
}
