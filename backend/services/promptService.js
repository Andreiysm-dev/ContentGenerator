/**
 * promptService.js
 *
 * Loads AI prompt templates from the `ai_prompt_settings` Supabase table.
 * Falls back to the hardcoded defaults in prompts.js if the table does not
 * exist yet or the requested key is missing.
 *
 * This lets admins override prompts via the Admin Dashboard without
 * touching code or doing a deployment.
 */

import db from '../database/db.js';
import {
    CAPTION_USER_PROMPT_TEMPLATE,
    REVIEW_USER_PROMPT_TEMPLATE,
    IMAGE_GENERATION_SYSTEM_PROMPT,
    IMAGE_GENERATION_USER_PROMPT,
    BRAND_PACK_SYSTEM_PROMPT,
    BRAND_PACK_USER_PROMPT,
    BRAND_CAPABILITY_SYSTEM_PROMPT,
    BRAND_CAPABILITY_USER_PROMPT,
    WRITER_AGENT_SYSTEM_PROMPT,
    WRITER_AGENT_USER_PROMPT,
    REVIEWER_AGENT_SYSTEM_PROMPT,
    REVIEWER_AGENT_USER_PROMPT,
    VISUAL_IDENTITY_SYSTEM_PROMPT,
    VISUAL_IDENTITY_USER_PROMPT,
} from './prompts.js';

/** Map from DB key → hardcoded fallback value */
const FALLBACKS = {
    caption_user_prompt: CAPTION_USER_PROMPT_TEMPLATE,
    review_user_prompt: REVIEW_USER_PROMPT_TEMPLATE,
    image_generation_system_prompt: IMAGE_GENERATION_SYSTEM_PROMPT,
    image_generation_user_prompt: IMAGE_GENERATION_USER_PROMPT,
    brand_pack_system_prompt: BRAND_PACK_SYSTEM_PROMPT,
    brand_pack_user_prompt: BRAND_PACK_USER_PROMPT,
    brand_capability_system_prompt: BRAND_CAPABILITY_SYSTEM_PROMPT,
    brand_capability_user_prompt: BRAND_CAPABILITY_USER_PROMPT,
    writer_agent_system_prompt: WRITER_AGENT_SYSTEM_PROMPT,
    writer_agent_user_prompt: WRITER_AGENT_USER_PROMPT,
    reviewer_agent_system_prompt: REVIEWER_AGENT_SYSTEM_PROMPT,
    reviewer_agent_user_prompt: REVIEWER_AGENT_USER_PROMPT,
    visual_identity_system_prompt: VISUAL_IDENTITY_SYSTEM_PROMPT,
    visual_identity_user_prompt: VISUAL_IDENTITY_USER_PROMPT,
};

// Simple in-process cache so every generation request doesn't hit DB.
// Cache is invalidated when an admin saves a prompt update.
let promptCache = null;
let cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Invalidate the in-process cache (called after admin updates a prompt) */
export function invalidatePromptCache() {
    promptCache = null;
    cacheTs = 0;
}

/**
 * Load ALL prompts from DB (with fallback).
 * Returns a plain object keyed by prompt key.
 */
async function loadAllPrompts() {
    if (promptCache && Date.now() - cacheTs < CACHE_TTL_MS) {
        return promptCache;
    }

    let dbPrompts = {};
    try {
        const { data, error } = await db
            .from('ai_prompt_settings')
            .select('key, value');

        if (!error && Array.isArray(data)) {
            for (const row of data) {
                dbPrompts[row.key] = row.value;
            }
        }
    } catch (e) {
        // Table may not exist yet — silently fall through to hardcoded defaults
        console.warn('[promptService] Could not load prompts from DB, using hardcoded defaults:', e.message);
    }

    // Merge: DB values override hardcoded defaults
    const merged = { ...FALLBACKS, ...dbPrompts };
    promptCache = merged;
    cacheTs = Date.now();
    return merged;
}

/**
 * Get a single prompt by key.
 * @param {string} key - e.g. 'caption_user_prompt'
 * @returns {Promise<string>}
 */
export async function getPrompt(key) {
    const all = await loadAllPrompts();
    const value = all[key];
    if (value == null) {
        console.warn(`[promptService] Unknown prompt key: "${key}", returning empty string`);
        return '';
    }
    return value;
}

/**
 * Get all prompts (for admin display).
 * @returns {Promise<Record<string, string>>}
 */
export async function getAllPrompts() {
    return loadAllPrompts();
}

/**
 * Save a prompt to DB (admin only — call this from the admin controller).
 * Also invalidates the cache so the next generation picks up the new value.
 */
export async function savePrompt(key, value) {
    if (!(key in FALLBACKS)) {
        return { ok: false, error: `Unknown prompt key: "${key}"` };
    }

    const { error } = await db
        .from('ai_prompt_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
        return { ok: false, error: error.message };
    }

    invalidatePromptCache();
    return { ok: true };
}

/**
 * Reset a prompt back to its hardcoded default by deleting the DB override.
 */
export async function resetPrompt(key) {
    if (!(key in FALLBACKS)) {
        return { ok: false, error: `Unknown prompt key: "${key}"` };
    }

    const { error } = await db
        .from('ai_prompt_settings')
        .delete()
        .eq('key', key);

    if (error) {
        return { ok: false, error: error.message };
    }

    invalidatePromptCache();
    return { ok: true, defaultValue: FALLBACKS[key] };
}
