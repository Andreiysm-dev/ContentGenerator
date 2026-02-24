import db from '../database/db.js';
import { logApiUsage } from './apiUsageService.js';

/**
 * Calls Replicate API to generate an image.
 * @param {Object} params
 * @param {string} params.prompt - The image generation prompt.
 * @param {string} params.model - The replicate model to use (default: stability-ai/sdxl).
 * @param {string} params.aspectRatio - Aspect ratio (default: "1:1").
 * @returns {Promise<{ok: boolean, url?: string, error?: string}>}
 */
export const callReplicatePredict = async ({
    prompt,
    model = 'black-forest-labs/flux-dev',
    aspectRatio = '1:1',
    companyId,
    userId
}) => {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
        return { ok: false, error: 'Missing REPLICATE_API_TOKEN in environment' };
    }

    try {
        console.log(`[Replicate] Calling model: ${model}`);

        // Using fetch directly to avoid extra dependencies if possible, 
        // but Replicate usually prefers their SDK. However, standard REST works fine.
        const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait' // This makes the request synchronous (up to 60s)
            },
            body: JSON.stringify({
                input: {
                    prompt: prompt,
                    aspect_ratio: aspectRatio,
                    output_format: 'webp'
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Replicate] API Error:', data);
            return { ok: false, error: data.detail || 'Replicate API error' };
        }

        // Replicate returns an array or a string depending on the model
        let imageUrl = null;
        if (Array.isArray(data.output)) {
            imageUrl = data.output[0];
        } else if (typeof data.output === 'string') {
            imageUrl = data.output;
        }

        if (!imageUrl) {
            console.error('[Replicate] No output URL in response:', data);
            return { ok: false, error: 'No image URL returned from Replicate' };
        }

        // Log Usage
        await logApiUsage({
            companyId,
            userId,
            provider: 'replicate',
            model: model,
            type: 'image_generation',
            metadata: { aspectRatio }
        });

        return { ok: true, url: imageUrl };
    } catch (error) {
        console.error('[Replicate] Unexpected Error:', error);
        return { ok: false, error: error.message };
    }
};
