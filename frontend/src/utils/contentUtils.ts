// Pure utility functions for content calendar data.
// These functions have no React dependencies and can be imported anywhere.

import { supabaseBaseUrl } from '@/constants/app';

/**
 * Extracts attached design URLs from a calendar row.
 * Handles all storage formats: array, JSON string, plain string.
 */
export const getAttachedDesignUrls = (row: any): string[] => {
  if (!row?.attachedDesign) return [];
  const raw = row.attachedDesign;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.urls)) return parsed.urls.filter(Boolean);
    } catch {
      return raw ? [raw] : [];
    }
  }
  if (typeof raw === 'object' && Array.isArray((raw as any).urls)) return (raw as any).urls.filter(Boolean);
  return [];
};

/**
 * Resolves the generated image URL for a calendar row.
 * Builds a full Supabase public URL from a storage path if needed.
 */
export const getImageGeneratedUrl = (row: any | null): string | null => {
  if (!row) return null;
  const ig =
    (row as any).imageGenerated ||
    (row as any).imageGeneratedUrl ||
    (row as any).imageUrl ||
    (row as any).image ||
    (row as any).generatedImage;

  if (!ig) return null;

  if (typeof ig === 'string' && (ig.startsWith('http://') || ig.startsWith('https://'))) {
    return ig;
  }

  const base = typeof supabaseBaseUrl === 'string' ? supabaseBaseUrl.replace(/\/$/, '') : '';

  const normalize = (value: string): string => {
    const v = value.trim();
    if (!v) return v;
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    if (!base) return v;
    if (v.startsWith('storage/v1/object/public/')) return `${base}/${v}`;
    if (v.startsWith('/storage/v1/object/public/')) return `${base}${v}`;
    if (v.startsWith('generated-images/')) return `${base}/storage/v1/object/public/${v}`;
    return `${base}/storage/v1/object/public/generated-images/${v}`;
  };

  if (typeof ig === 'string') {
    const trimmed = ig.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          if (typeof (parsed as any).url === 'string') return normalize((parsed as any).url);
          if (typeof (parsed as any).imageUrl === 'string') return normalize((parsed as any).imageUrl);
          if (typeof (parsed as any).path === 'string') return normalize((parsed as any).path);
        }
      } catch {
        // fall through
      }
    }
    return normalize(trimmed);
  }
  if (typeof ig === 'object') {
    if (typeof (ig as any).url === 'string') return normalize((ig as any).url);
    if (typeof (ig as any).imageUrl === 'string') return normalize((ig as any).imageUrl);
    if (typeof (ig as any).path === 'string') return normalize((ig as any).path);
  }
  return null;
};

/**
 * Returns a stable string signature for the imageGenerated field,
 * used to detect when a new image has been generated.
 */
export const getImageGeneratedSignature = (row: any | null): string | null => {
  if (!row) return null;
  const ig = (row as any).imageGenerated;
  if (ig === null || ig === undefined) return null;
  try {
    return typeof ig === 'string' ? ig : JSON.stringify(ig);
  } catch {
    return String(ig);
  }
};
