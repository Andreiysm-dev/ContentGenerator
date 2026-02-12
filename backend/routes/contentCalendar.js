import express from 'express';
import {
    createContentCalendar,
    getAllContentCalendars,
    getContentCalendarById,
    getContentCalendarsByCompanyId,
    getContentCalendarsByDateRange,
    getContentCalendarsByStatus,
    updateContentCalendar,
    deleteContentCalendar,
    deleteContentCalendarsByCompanyId,
    batchGenerateImages
} from '../controller/contentCalendarController.js';
import { generateCaptionForContent, generateCaptionsBulk } from '../services/captionGenerationService.js';
import { reviewContentForCalendarRow, reviewContentBulk } from '../services/contentReviewService.js';

const router = express.Router();

// CREATE - POST /api/content-calendar
router.post('/content-calendar', createContentCalendar);

// READ - GET /api/content-calendar (get all)
router.get('/content-calendar', getAllContentCalendars);

// READ - GET /api/content-calendar/date-range (get by date range)
// Query params: startDate, endDate, companyId (optional)
router.get('/content-calendar/date-range', getContentCalendarsByDateRange);

// READ - GET /api/content-calendar/status/:status (get by status)
// Query params: companyId (optional)
router.get('/content-calendar/status/:status', getContentCalendarsByStatus);

// READ - GET /api/content-calendar/:id (get one by ID)
router.get('/content-calendar/:id', getContentCalendarById);

// READ - GET /api/content-calendar/company/:companyId (get all by company)
router.get('/content-calendar/company/:companyId', getContentCalendarsByCompanyId);

// POST - /api/content-calendar/batch-generate-image
router.post('/content-calendar/batch-generate-image', batchGenerateImages);

// POST - /api/content-calendar/:contentCalendarId/generate-dmp
router.post('/content-calendar/:contentCalendarId/generate-dmp', async (req, res) => {
    try {
        const { contentCalendarId } = req.params;
        const { systemInstruction, provider, model } = req.body;
        const userId = req.user?.id;
        const { generateDmpForCalendarRow } = await import('../services/imageGenerationService.js');
        const result = await generateDmpForCalendarRow(contentCalendarId, { userId, systemInstruction, provider, model });
        if (!result.ok) {
            return res.status(result.status || 500).json({ error: result.error });
        }
        return res.status(200).json({ dmp: result.dmp, contentCalendar: result.contentCalendar });
    } catch (err) {
        console.error('Generate DMP endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - /api/content-calendar/:contentCalendarId/generate-image-from-dmp
router.post('/content-calendar/:contentCalendarId/generate-image-from-dmp', async (req, res) => {
    try {
        const { contentCalendarId } = req.params;
        const { dmp, provider, model } = req.body;
        const userId = req.user?.id;
        const { generateImageFromCustomDmp } = await import('../services/imageGenerationService.js');
        const result = await generateImageFromCustomDmp(contentCalendarId, dmp, { userId, provider, model });
        if (!result.ok) {
            return res.status(result.status || 500).json({ error: result.error });
        }
        return res.status(200).json({ result: result.result, contentCalendar: result.contentCalendar });
    } catch (err) {
        console.error('Generate image from DMP endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - /api/content-calendar/:contentCalendarId/generate-caption
router.post('/content-calendar/:contentCalendarId/generate-caption', async (req, res) => {
    try {
        const { contentCalendarId } = req.params;
        const userId = req.user?.id;
        const result = await generateCaptionForContent(contentCalendarId, { userId });
        if (!result.ok) {
            return res.status(result.status || 500).json({ error: result.error, code: result.code });
        }
        return res.status(200).json({ result: result.result, contentCalendar: result.contentCalendar });
    } catch (err) {
        console.error('Generate caption endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - /api/content-calendar/generate-captions
router.post('/content-calendar/generate-captions', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { contentCalendarIds } = req.body || {};
        const result = await generateCaptionsBulk(contentCalendarIds, { userId });
        if (!result.ok) {
            return res.status(result.status || 500).json({ error: result.error });
        }
        return res.status(200).json({ summary: result.summary });
    } catch (err) {
        console.error('Bulk generate captions endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - /api/content-calendar/:contentCalendarId/review-content
router.post('/content-calendar/:contentCalendarId/review-content', async (req, res) => {
    try {
        const { contentCalendarId } = req.params;
        const userId = req.user?.id;
        const result = await reviewContentForCalendarRow(contentCalendarId, { userId });
        if (!result.ok) {
            return res.status(result.status || 500).json({ error: result.error, code: result.code });
        }
        return res.status(200).json({ result: result.result, contentCalendar: result.contentCalendar });
    } catch (err) {
        console.error('Review content endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST - /api/content-calendar/review-content-bulk
router.post('/content-calendar/review-content-bulk', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { contentCalendarIds } = req.body || {};
        const result = await reviewContentBulk(contentCalendarIds, { userId });
        if (!result.ok) {
            return res.status(result.status || 500).json({ error: result.error });
        }
        return res.status(200).json({ summary: result.summary });
    } catch (err) {
        console.error('Bulk review content endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE - PUT /api/content-calendar/:id
router.put('/content-calendar/:id', updateContentCalendar);

// DELETE - DELETE /api/content-calendar/:id (delete one)
router.delete('/content-calendar/:id', deleteContentCalendar);

// DELETE - DELETE /api/content-calendar/company/:companyId (delete all for a company)
router.delete('/content-calendar/company/:companyId', deleteContentCalendarsByCompanyId);

export default router;