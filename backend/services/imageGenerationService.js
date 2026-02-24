import db from '../database/db.js';
import { IMAGE_GENERATION_SYSTEM_PROMPT, IMAGE_GENERATION_USER_PROMPT } from './prompts.js';
import { sendNotification, sendTeamNotification } from './notificationService.js';
import { callReplicatePredict } from './replicateService.js';
import { callFalAiPredict } from './falService.js';
import { logApiUsage } from './apiUsageService.js';

const callOpenAIText = async ({ systemPrompt, userPrompt, images = [], temperature = 1, companyId, userId }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Missing OPENAI_API_KEY' };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // Construct message content
  let userMessageContent = [];

  if (images && images.length > 0) {
    userMessageContent.push({ type: 'text', text: userPrompt || '' });
    for (const img of images) {
      userMessageContent.push({
        type: 'image_url',
        image_url: {
          url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
        }
      });
    }
  } else {
    userMessageContent = userPrompt || '';
  }

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
        { role: 'user', content: userMessageContent },
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
      outputTokens: data.usage.completion_tokens
    });
  }

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

const cleanPromptForImagen = (prompt) => {
  if (typeof prompt !== 'string') return '';
  // Strip markdown markers that Gemini often draws literally on the image
  return prompt
    .replace(/\*\*/g, '') // remove bold markers
    .replace(/__/g, '')   // remove italic markers
    .replace(/#/g, '')    // remove heading markers
    .trim();
};

const callImagenPredict = async ({ model, prompt, companyId, userId, aspectRatio }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Missing GEMINI_API_KEY' };
  }

  // FORCE Imagen 4.0 as it is verified to work with the :predict endpoint and sampleImageSize: 1024
  const actualModel = 'imagen-4.0-generate-001';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:predict`;

  const body = {
    instances: [
      { prompt: cleanPromptForImagen(prompt) }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: opts.aspectRatio || '1:1',
      sampleImageSize: '2K' // Upgraded to 2K for premium quality
    }
  };

  const res = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    const detail = typeof raw === 'string' && raw.trim() ? `: ${raw.slice(0, 800)}` : '';
    return { ok: false, error: `Gemini/Imagen error ${res.status}${detail}`, raw };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Gemini returned non-JSON response', raw };
  }

  // Parse :predict response format
  // Expected: { predictions: [ { bytesBase64Encoded: "...", mimeType: "image/png" } ] }
  const predictions = Array.isArray(data?.predictions) ? data.predictions : [];
  if (predictions.length === 0) {
    return { ok: false, error: 'No predictions returned', raw: data };
  }

  const base64 = predictions[0]?.bytesBase64Encoded;
  if (!base64) {
    return { ok: false, error: 'Missing bytesBase64Encoded in prediction', raw: data };
  }

  // Log Usage
  await logApiUsage({
    companyId,
    userId,
    provider: 'google',
    model: actualModel,
    type: 'image_generation',
    metadata: { aspectRatio: body.parameters.aspectRatio }
  });

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

const loadContentCalendarRow = async ({ contentCalendarId, userId, requiredPermission = null }) => {
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
    .select('user_id, collaborator_ids, companyName, custom_roles, collaborator_roles')
    .eq('companyId', row.companyId)
    .single();

  if (companyError || !company) {
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

  // Fetch user metadata for triggeredByName
  const { data: { user }, error: userError } = await db.auth.admin.getUserById(userId);
  const triggeredByName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email || 'Unknown User';

  return { ok: true, row, companyName: company.companyName, triggeredByName };
};

export async function generateDmpForCalendarRow(contentCalendarId, opts = {}) {
  const userId = opts.userId;
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  const loaded = await loadContentCalendarRow({ contentCalendarId, userId, requiredPermission: 'canGenerate' });
  if (!loaded.ok) return loaded;

  const row = loaded.row;
  const companyName = loaded.companyName;
  const triggeredByName = loaded.triggeredByName;

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

  const openAiSystem = IMAGE_GENERATION_SYSTEM_PROMPT;
  let openAiUser = IMAGE_GENERATION_USER_PROMPT;

  if (opts.designReferences && opts.designReferences.length > 0) {
    openAiUser += '\n\nIMPORTANT: Use the attached reference images as a visual anchor and stylistic inspiration for the Style Guide. Adapt the mood, composition, and artistic details to suit the brand rules while remaining faithful to the references provided.';
  }

  if (opts.imageContext && opts.imageContext.trim()) {
    openAiUser += `\n\nSCENE CONTEXT: The user has specified the following scene description: "${opts.imageContext}". Use this as the core subject matter.`;
  }

  if (opts.imageMood && opts.imageMood !== 'Brand Default') {
    openAiUser += `\n\nMOOD OVERRIDE: The user requested a "${opts.imageMood}" mood. Adapt the visual style to reflect this while maintaining brand consistency where possible.`;
  }

  if (opts.imageLighting && opts.imageLighting !== 'Brand Default') {
    openAiUser += `\n\nLIGHTING OVERRIDE: The user requested "${opts.imageLighting}" lighting. Ensure the scene is lit according to this specification.`;
  }

  if (opts.aspectRatio) {
    openAiUser += `\n\nASPECT RATIO: The design should be optimized for a ${opts.aspectRatio} aspect ratio. Ensure the composition and focal points are balanced for this specific framing.`;
  }

  const openAiRes = await callOpenAIText({
    systemPrompt: openAiSystem.replaceAll('{{brandKB.systemInstruction}}', systemInstruction || ''),
    userPrompt: openAiUser
      .replaceAll('{{contentCalendar.finalCaption}}', String(row.finalCaption || row.captionOutput || ''))
      .replaceAll('{{contentCalendar.finalCTA}}', String(row.finalCTA || row.cta || '')),
    images: opts.designReferences || [],
    temperature: 1,
    companyId: row.companyId,
    userId: userId
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

  return { ok: true, dmp: dmpRaw, row: { ...row, dmp: dmpRaw }, companyName, triggeredByName };
}

export async function generateImageForCalendarRow(contentCalendarId, opts = {}) {
  const userId = opts.userId;
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  // 1. Load row to check for existing DMP
  const loaded = await loadContentCalendarRow({ contentCalendarId, userId, requiredPermission: 'canGenerate' });
  if (!loaded.ok) return loaded;

  let row = loaded.row;
  let companyName = loaded.companyName;
  let triggeredByName = loaded.triggeredByName;
  let dmpRaw = row.dmp;

  // 2. Generate DMP only if missing or forced
  if (!dmpRaw || opts.forceDmpRefresh) {
    const dmpResult = await generateDmpForCalendarRow(contentCalendarId, opts);
    if (!dmpResult.ok) return dmpResult;
    dmpRaw = dmpResult.dmp;
    row = dmpResult.row;
  }

  // 3. Proceed to Image Generation
  const parsed = parseMegaPromptBlock(dmpRaw);
  if (!parsed.ok) {
    return { ok: false, status: 500, error: parsed.error };
  }

  const { mega, negative } = parsed.value;
  const fullPrompt = negative ? `${mega}\n\nNEGATIVE: ${negative}` : mega;

  const provider = opts.provider || 'google';
  const model = opts.model || (provider === 'google' ? 'imagen-4.0-generate-001' : (provider === 'fal' ? 'fal-ai/flux-pro/v1.1' : 'black-forest-labs/flux-dev'));

  let bytes;
  let extension = 'png';

  if (provider === 'replicate') {
    const replicateRes = await callReplicatePredict({
      prompt: fullPrompt,
      model: model,
      aspectRatio: opts.aspectRatio || '1:1',
      companyId: row.companyId,
      userId: userId
    });

    if (!replicateRes.ok) {
      return { ok: false, status: 500, error: replicateRes.error };
    }

    // Fetch the image from Replicate URL
    const imageFetch = await fetch(replicateRes.url);
    if (!imageFetch.ok) {
      return { ok: false, status: 500, error: 'Failed to download image from Replicate' };
    }
    const arrayBuffer = await imageFetch.arrayBuffer();
    bytes = Buffer.from(arrayBuffer);
    extension = replicateRes.url.split('.').pop().split('?')[0] || 'png';
  } else if (provider === 'fal') {
    const falRes = await callFalAiPredict({
      prompt: fullPrompt,
      model: model,
      aspectRatio: opts.aspectRatio || 'square',
      companyId: row.companyId,
      userId: userId
    });

    if (!falRes.ok) {
      return { ok: false, status: 500, error: falRes.error };
    }

    // Fetch the image from Fal.ai URL
    const imageFetch = await fetch(falRes.url);
    if (!imageFetch.ok) {
      return { ok: false, status: 500, error: 'Failed to download image from Fal.ai' };
    }
    const arrayBuffer = await imageFetch.arrayBuffer();
    bytes = Buffer.from(arrayBuffer);
    extension = falRes.url.split('.').pop().split('?')[0] || 'jpg';
    if (extension === 'jpeg') extension = 'jpg';
  } else {
    // Default to Google Imagen
    const imagenRes = await callImagenPredict({
      model: model,
      prompt: fullPrompt,
      aspectRatio: opts.aspectRatio || '1:1',
      companyId: row.companyId,
      userId: userId
    });

    if (!imagenRes.ok) {
      return { ok: false, status: 500, error: imagenRes.error };
    }
    bytes = Buffer.from(imagenRes.base64, 'base64');
  }

  const uploadRes = await uploadGeneratedImage({
    companyId: row.companyId,
    contentCalendarId,
    imageBytes: bytes,
    extension: extension,
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

  if (!saveError) {
    await sendTeamNotification({
      companyId: row.companyId,
      title: 'Image Generated',
      message: 'Image generation completed successfully',
      type: 'success',
      link: '/calendar',
      triggeredByName,
      companyName,
    });
  }

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

  const loaded = await loadContentCalendarRow({ contentCalendarId, userId, requiredPermission: 'canGenerate' });
  if (!loaded.ok) return loaded;

  const row = loaded.row;
  const companyName = loaded.companyName;
  const triggeredByName = loaded.triggeredByName;

  const { error: saveDmpError } = await db
    .from('contentCalendar')
    .update({ dmp: dmp.trim() })
    .eq('contentCalendarId', contentCalendarId);

  if (saveDmpError) {
    return { ok: false, status: 500, error: 'Failed to save DMP' };
  }

  const provider = opts.provider || 'google';
  const model = opts.model || (provider === 'google' ? 'imagen-4.0-generate-001' : (provider === 'fal' ? 'fal-ai/flux-pro/v1.1' : 'black-forest-labs/flux-dev'));

  let bytes;
  let extension = 'png';

  if (provider === 'replicate') {
    const replicateRes = await callReplicatePredict({
      prompt: dmp.trim(),
      model: model,
      aspectRatio: opts.aspectRatio || '1:1',
      companyId: row.companyId,
      userId: userId
    });

    if (!replicateRes.ok) {
      return { ok: false, status: 500, error: replicateRes.error };
    }

    const imageFetch = await fetch(replicateRes.url);
    if (!imageFetch.ok) {
      return { ok: false, status: 500, error: 'Failed to download image from Replicate' };
    }
    const arrayBuffer = await imageFetch.arrayBuffer();
    bytes = Buffer.from(arrayBuffer);
    extension = replicateRes.url.split('.').pop().split('?')[0] || 'png';
  } else if (provider === 'fal') {
    const falRes = await callFalAiPredict({
      prompt: dmp.trim(),
      model: model,
      aspectRatio: opts.aspectRatio || 'square',
      companyId: row.companyId,
      userId: userId
    });

    if (!falRes.ok) {
      return { ok: false, status: 500, error: falRes.error };
    }

    const imageFetch = await fetch(falRes.url);
    if (!imageFetch.ok) {
      return { ok: false, status: 500, error: 'Failed to download image from Fal.ai' };
    }
    const arrayBuffer = await imageFetch.arrayBuffer();
    bytes = Buffer.from(arrayBuffer);
    extension = falRes.url.split('.').pop().split('?')[0] || 'jpg';
    if (extension === 'jpeg') extension = 'jpg';
  } else {
    const imagenRes = await callImagenPredict({
      model: model,
      prompt: dmp.trim(),
      aspectRatio: opts.aspectRatio || '1:1',
      companyId: row.companyId,
      userId: userId
    });

    if (!imagenRes.ok) {
      return { ok: false, status: 500, error: imagenRes.error };
    }
    bytes = Buffer.from(imagenRes.base64, 'base64');
  }

  const uploadRes = await uploadGeneratedImage({
    companyId: row.companyId,
    contentCalendarId,
    imageBytes: bytes,
    extension: extension,
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

  await sendTeamNotification({
    companyId: row.companyId,
    title: 'Image Generated (Custom DMP)',
    message: 'Image generation from custom DMP completed successfully',
    type: 'success',
    link: '/calendar',
    triggeredByName,
    companyName,
  });

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

export async function analyzeBrandVisuals(images = []) {
  if (!images || images.length === 0) {
    return { ok: false, error: 'No images provided' };
  }

  const systemPrompt = `You are a high-end Brand Identity Strategist. 
Analyze the provided inspiration images and extract a definitive "Visual Identity Summary".
Identify colors, typography style, imagery mood, and preferred composition.

Output your analysis in a structured format:
COLORS: <Primary Hex>, <Secondary Hex>
FONTS: <Type Style>
MOOD: <Mood Description>
COMPOSITION: <Layout Style>
VIBE: <Detailed 2-sentence description of the aesthetic rules>`;

  const userPrompt = `Analyze these brand inspiration images and define the visual rules for our AI system.`;


  const res = await callOpenAIText({
    systemPrompt,
    userPrompt,
    images: images,
    temperature: 0.7
  });

  if (!res.ok) {
    console.error('[analyzeBrandVisuals] OpenAI call failed:', res.error);
    return res;
  }


  return { ok: true, analysis: res.content };
}
