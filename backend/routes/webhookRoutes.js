import express from 'express';
import { reviewContentForCalendarRowSystem } from '../services/contentReviewService.js';
import { generateCaptionForContentSystem } from '../services/captionGenerationService.js';
import { generateBrandRulesSystem } from '../services/brandRulesService.js';

const router = express.Router();

const getSecretFromRequest = (req) => {
  const headerSecret = req.headers['x-webhook-secret'];
  if (typeof headerSecret === 'string' && headerSecret.trim()) return headerSecret.trim();

  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    if (token) return token;
  }

  return null;
};

router.post('/webhooks/content-review', async (req, res) => {
  try {
    const expectedSecret = process.env.CONTENT_REVIEW_WEBHOOK_SECRET;

    if (expectedSecret) {
      const provided = getSecretFromRequest(req);
      if (!provided || provided !== expectedSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    } else {
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const { contentCalendarId, companyId, status } = req.body || {};

    const result = await reviewContentForCalendarRowSystem({
      contentCalendarId,
      companyId,
      status,
    });

    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ result: result.result, contentCalendar: result.contentCalendar });
  } catch (err) {
    console.error('Content review webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/webhooks/content-generate', async (req, res) => {
  try {
    const expectedSecret = process.env.CONTENT_GENERATE_WEBHOOK_SECRET;

    if (expectedSecret) {
      const provided = getSecretFromRequest(req);
      if (!provided || provided !== expectedSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    } else {
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const { contentCalendarId, companyId, status } = req.body || {};

    const result = await generateCaptionForContentSystem({
      contentCalendarId,
      companyId,
      status,
    });

    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({ result: result.result, contentCalendar: result.contentCalendar });
  } catch (err) {
    console.error('Content generate webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/webhooks/brand-rules-generate', async (req, res) => {
  try {
    const expectedSecret = process.env.BRAND_RULES_WEBHOOK_SECRET;

    if (expectedSecret) {
      const provided = getSecretFromRequest(req);
      if (!provided || provided !== expectedSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    } else {
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const { companyId, brandKbId, formAnswer } = req.body || {};

    const result = await generateBrandRulesSystem({ companyId, brandKbId, formAnswer });
    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    return res.status(200).json({ brandKB: result.brandKB, outputs: result.outputs });
  } catch (err) {
    console.error('Brand rules webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
