import db from '../database/db.js';

/**
 * Calls Fal.ai API to generate an image.
 * @param {Object} params
 * @param {string} params.prompt - The image generation prompt.
 * @param {string} params.model - The fal.ai model to use (default: fal-ai/flux-pro).
 * @param {string} params.aspectRatio - Aspect ratio (default: "square").
 * @returns {Promise<{ok: boolean, url?: string, error?: string}>}
 */
export const callFalAiPredict = async ({
    prompt,
    model = 'fal-ai/flux-pro/v1.1',
    aspectRatio = 'square' // Fal often uses "square", "landscape_4_3", "landscape_16_9", "portrait_3_4", "portrait_9_16"
}) => {
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
        return { ok: false, error: 'Missing FAL_KEY in environment' };
    }

    try {
        console.log(`[Fal.ai] Calling model: ${model}`);

        // Fal.ai uses a queue-based system for some models, but usually for Flux it is fast enough to await.
        // However, standard practice is to submitting to the queue and waiting for the result.
        // For simplicity and speed (since Fal is fast), we can try the synchronous/blocking endpoint if available,
        // or just use the standard inference endpoint which usually returns quickly for Flux.

        // Official Fal.ai endpoint structure: https://fal.ai/models/fal-ai/flux-pro/api
        const endpoint = `https://fal.run/${model}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                image_size: aspectRatio === '1:1' ? 'square' : aspectRatio, // Map 1:1 to "square" if needed, though Fal might accept "square" directly
                safety_tolerance: "2", // 1 (strict) to 6 (permissive)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Fal.ai] API Error:', data);
            return { ok: false, error: data.detail || data.message || 'Fal.ai API error' };
        }

        // Fal.ai Flux Pro returns: { images: [ { url: "...", ... } ], ... }
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            return { ok: true, url: data.images[0].url };
        }

        console.error('[Fal.ai] No image URL in response:', data);
        return { ok: false, error: 'No image URL returned from Fal.ai' };

    } catch (error) {
        console.error('[Fal.ai] Unexpected Error:', error);
        return { ok: false, error: error.message };
    }
};
