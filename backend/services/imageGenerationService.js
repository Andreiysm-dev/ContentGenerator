import db from '../database/db.js';
import { logAudit } from './auditService.js';
import { getTargetStatusFromAutomation } from './kanbanAutomationService.js';
import { getPrompt } from './promptService.js';
import { sendNotification, sendTeamNotification } from './notificationService.js';
import { callReplicatePredict } from './replicateService.js';
import { callFalAiPredict } from './falService.js';
import { logApiUsage } from './apiUsageService.js';

const callOpenAIImagePredict = async ({ prompt, model = 'dall-e-3', companyId, userId, aspectRatio }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Missing OPENAI_API_KEY' };
  }

  // Model and size mapping
  let size = '1024x1024';
  if (aspectRatio === '16:9' || aspectRatio === 'landscape') size = '1792x1024';
  if (aspectRatio === '9:16' || aspectRatio === 'portrait') size = '1024x1792';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size,
      quality: 'hd', 
    }),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    const detail = typeof raw === 'string' && raw.trim() ? `: ${raw.slice(0, 500)}` : '';
    return { ok: false, error: `OpenAI Image error ${res.status}${detail}`, raw };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'OpenAI returned non-JSON response environment', raw };
  }

  const url = data?.data?.[0]?.url;
  if (!url) {
    return { ok: false, error: 'No image URL returned by OpenAI', raw: data };
  }

  // Log Usage
  await logApiUsage({
    companyId,
    userId,
    provider: 'openai',
    model,
    type: 'image_generation',
    metadata: { size, quality: 'hd' }
  });

  return { ok: true, url, raw: data };
};

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

  const openAiSystem = await getPrompt('image_generation_system_prompt');

  // Refined Logic: Triple-Threat Merger
  // Priority 1: User Instructions (Direct Subject)
  // Priority 2: Post Metadata (Contextual Alignment)
  // Priority 3: Global Brand Rules (Aesthetic Constraint)

  const userInstructions = opts.imageContext || ''; // Now treated as the primary Director's Chair instruction
  const caption = String(row.finalCaption || row.captionOutput || 'No caption provided.');

  let openAiUser = `### TRIPLE-THREAT DESIGN DIRECTIVE ###

1. PRIMARY DIRECTIVE (Subject & Actions):
${userInstructions ? userInstructions : "Propose a unique, high-end visual that represents the essence of the caption provided below."}

2. CONTEXTUAL ALIGNMENT (Marketing Message):
Ensure the visual composition and elements reflect the core message and tone of this content:
"${caption}"

3. AESTHETIC CONSTRAINT (Brand Soul):
The final output MUST strictly adhere to these global brand visual rules:
"${systemInstruction}"

### INSTRUCTION SUMMARY ###
Strictly follow the Priority 1 (Subject) while layering on Priority 2 (Context) and constraining everything within Priority 3 (Style). If specific subject instructions are missing, use your creative expertise to propose a visually stunning concept based on the caption and brand rules.`;

  if (opts.designReferences && opts.designReferences.length > 0) {
    openAiUser += '\n\n4. VISUAL ANCHORS: Use the attached reference images as inspiration for composition and quality.';
  }

  if (opts.imageMood && opts.imageMood !== 'Brand Default') {
    openAiUser += `\n\nMOOD OVERRIDE: Adapt the visual style to a "${opts.imageMood}" mood.`;
  }

  if (opts.imageLighting && opts.imageLighting !== 'Brand Default') {
    openAiUser += `\n\nLIGHTING OVERRIDE: Apply "${opts.imageLighting}" lighting.`;
  }

  if (opts.aspectRatio) {
    openAiUser += `\n\nASPECT RATIO: Optimize for ${opts.aspectRatio}.`;
  }

  const openAiRes = await callOpenAIText({
    systemPrompt: openAiSystem.replaceAll('{{brandKB.systemInstruction}}', systemInstruction || ''),
    userPrompt: openAiUser,
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
  const model = opts.model || (provider === 'google' ? 'imagen-4.0-generate-001' : (provider === 'fal' ? 'fal-ai/flux-pro/v1.1' : (provider === 'openai' ? 'dall-e-3' : 'black-forest-labs/flux-dev')));

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
  } else if (provider === 'openai') {
    const openaiRes = await callOpenAIImagePredict({
      prompt: fullPrompt,
      model: model,
      aspectRatio: opts.aspectRatio || '1:1',
      companyId: row.companyId,
      userId: userId
    });

    if (!openaiRes.ok) {
      return { ok: false, status: 500, error: openaiRes.error };
    }

    // Fetch the image from OpenAI URL
    const imageFetch = await fetch(openaiRes.url);
    if (!imageFetch.ok) {
      return { ok: false, status: 500, error: 'Failed to download image from OpenAI' };
    }
    const arrayBuffer = await imageFetch.arrayBuffer();
    bytes = Buffer.from(arrayBuffer);
    extension = 'png'; // OpenAI DALL-E 3 usually returns PNG
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

  const finalStatus = await getTargetStatusFromAutomation(row.companyId, 'image_generated', 'Design Completed');

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      status: finalStatus,
      imageGenerated: uploadRes.path,
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (!saveError) {
    await logAudit(userId, 'IMAGE_GENERATED', 'contentCalendar', contentCalendarId, {
      companyId: row.companyId,
      provider,
      model
    });

    await sendTeamNotification({
      companyId: row.companyId,
      title: 'Image Generated',
      message: 'Image generation completed successfully',
      type: 'success',
      link: '/calendar',
      triggeredByName,
      companyName,
    });

    // Notification for Locked Columns (Approvals)
    const { checkAndNotifyApproval } = await import('./notificationService.js');
    await checkAndNotifyApproval({
      companyId: row.companyId,
      status: finalStatus,
      contentTheme: row.theme,
      triggeredByName,
      userId
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
  const model = opts.model || (provider === 'google' ? 'imagen-4.0-generate-001' : (provider === 'fal' ? 'fal-ai/flux-pro/v1.1' : (provider === 'openai' ? 'dall-e-3' : 'black-forest-labs/flux-dev')));

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
  } else if (provider === 'openai') {
    const openaiRes = await callOpenAIImagePredict({
      prompt: dmp.trim(),
      model: model,
      aspectRatio: opts.aspectRatio || '1:1',
      companyId: row.companyId,
      userId: userId
    });

    if (!openaiRes.ok) {
      return { ok: false, status: 500, error: openaiRes.error };
    }

    const imageFetch = await fetch(openaiRes.url);
    if (!imageFetch.ok) {
      return { ok: false, status: 500, error: 'Failed to download image from OpenAI' };
    }
    const arrayBuffer = await imageFetch.arrayBuffer();
    bytes = Buffer.from(arrayBuffer);
    extension = 'png';
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

  const finalStatus = await getTargetStatusFromAutomation(row.companyId, 'image_generated', 'Design Completed');

  const { data: updatedRows, error: saveError } = await db
    .from('contentCalendar')
    .update({
      status: finalStatus,
      imageGenerated: uploadRes.path,
    })
    .eq('contentCalendarId', contentCalendarId)
    .select();

  if (saveError) {
    return { ok: false, status: 500, error: 'Failed to save image output' };
  }

  await logAudit(userId, 'IMAGE_GENERATED', 'contentCalendar', contentCalendarId, {
    companyId: row.companyId,
    provider,
    model,
    customDmp: true
  });

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

export async function proposeImageIdeas(contentCalendarId, { userId }) {
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  const loaded = await loadContentCalendarRow({ contentCalendarId, userId });
  if (!loaded.ok) return loaded;

  const row = loaded.row;
  const { data: brandKB } = await db
    .from('brandKB')
    .select('systemInstruction')
    .eq('companyId', row.companyId)
    .limit(1)
    .maybeSingle();

  const systemInstruction = brandKB?.systemInstruction || 'Professional, high-quality visuals.';
  const caption = row.finalCaption || row.captionOutput || 'No caption provided.';

  const systemPrompt = `You are a Visual Creative Director. 
Your goal is to propose 3 distinct, stunning visual concepts for an AI image generator based on a caption and brand rules.
Each proposal should be a single, descriptive paragraph that acts as a prompt.

Output format:
CONCEPT 1: <description>
CONCEPT 2: <description>
CONCEPT 3: <description>

Do not include any other text.`;

  const userPrompt = `### BRAND RULES ###
${systemInstruction}

### CAPTION ###
"${caption}"

Propose 3 distinct visual directions.`;

  const res = await callOpenAIText({
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    companyId: row.companyId,
    userId
  });

  if (!res.ok) return res;

  const content = res.content || '';
  const ideas = content.split(/CONCEPT \d+:/i).filter(s => s.trim().length > 0).map(s => s.trim());

  return { ok: true, ideas: ideas.slice(0, 3) };
}
