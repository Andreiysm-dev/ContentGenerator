// Application-level constants extracted from App.tsx

export const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const supabaseBaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
export const revisionWebhookUrl = (import.meta.env as any).VITE_MAKE_REVISION_WEBHOOK || '';
export const defaultCompanyId = import.meta.env.VITE_COMPANY_ID || '';
export const VIEW_MODAL_POLL_MS = 1500;
export const CALENDAR_POLL_MS = 10000;
export const statusOptions = [
  '',
  'Generate',
  'Ready',
  'Revisioned',
  'Design Completed',
  'Scheduled',
];

// ── Brand Setup Option Arrays ─────────────────────────────────────────────────
export const industryOptions = [
  'Marketing & Advertising',
  'E-commerce',
  'SaaS / Software',
  'Finance',
  'Healthcare',
  'Real Estate',
  'Education',
  'Hospitality',
  'Other',
];

export const audienceRoleOptions = [
  'Founder / Owner',
  'Marketing Lead',
  'Sales Leader',
  'Operations',
  'HR / People',
  'Creator / Influencer',
  'Consumer',
];

export const painPointOptions = [
  'Need consistent brand voice',
  'Low engagement',
  'Limited internal bandwidth',
  'Hard to prove ROI',
  'Long approval cycles',
  'Need lead quality improvements',
];

export const noSayOptions = [
  'No guarantees',
  'No timelines',
  'No income claims',
  'No pricing',
  'No competitor comparisons',
  'No medical/legal promises',
];
