import express from 'express';
import { supabase } from '../database/db.js';
import authMiddleware from '../middleware/auth.js';
import { postToLinkedIn, postToFacebookPage, getFacebookPostInsights } from '../services/socialService.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/social/:companyId/accounts - List connected accounts
router.get('/social/:companyId/accounts', async (req, res) => {
    const { companyId } = req.params;
    const user = req.user;

    try {
        // 1. Verify user has access to this company
        const { data: company, error: companyError } = await supabase
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== user.id && !(company.collaborator_ids?.includes(user.id))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // For this MVP step, let's fetch the accounts.
        const { data: accounts, error } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('company_id', companyId);

        if (error) throw error;

        // Return safely (don't send full access tokens if not needed, but for now sending all is easiest for debugging)
        const safeAccounts = accounts.map(acc => ({
            id: acc.id,
            provider: acc.provider,
            profile_name: acc.profile_name,
            profile_picture: acc.profile_picture,
            created_at: acc.created_at
        }));

        res.json({ accounts: safeAccounts });
    } catch (error) {
        console.error('Error fetching social accounts:', error);
        res.status(500).json({ error: 'Failed to fetch social accounts' });
    }
});

// POST /api/social/:companyId/publish
// Body: { provider: 'linkedin', content: { text: "...", ... } }
router.post('/social/:companyId/publish', async (req, res) => {
    // Note: companyId is now expected in req.body as well, overriding the param if present.
    // The instruction implies companyId should be taken from the body.
    const { companyId, provider, content, contentCalendarId, accountId } = req.body;

    if (!companyId || !provider || !content) {
        return res.status(400).json({ error: 'companyId, provider, and content are required' });
    }

    if (!content || !content.text) {
        return res.status(400).json({ error: 'Content text is required' });
    }

    try {
        let result;
        if (provider === 'linkedin') {
            result = await postToLinkedIn(companyId, content, accountId);
        } else if (provider === 'facebook') {
            result = await postToFacebookPage(companyId, content, accountId);
        } else {
            return res.status(400).json({ error: 'Unsupported provider' });
        }

        // 1. If contentCalendarId provided, store post_id and provider for analytics
        if (contentCalendarId) {
            const socialPostId = result.id || result.post_id || result.id?.activity; // LinkedIn vs FB
            await supabase
                .from('contentCalendar')
                .update({
                    social_post_id: socialPostId,
                    social_provider: provider,
                    status: 'PUBLISHED' // Also update status if publishing from Studio
                })
                .eq('contentCalendarId', contentCalendarId);
        }

        res.json({ success: true, result });
    } catch (error) {
        console.error('Publish error:', error);
        const errorMessage = error.response?.data?.error?.message || error.message;
        res.status(500).json({ error: errorMessage });
    }
});

// GET /api/social/facebook/insights/:id - Get analytics for a post
router.get('/social/facebook/insights/:id', async (req, res) => {
    try {
        const { id } = req.params; // this is contentCalendarId

        // 1. Fetch social_post_id from contentCalendar
        const { data: row, error: rowErr } = await supabase
            .from('contentCalendar')
            .select('companyId, social_post_id, social_provider')
            .eq('contentCalendarId', id)
            .single();

        if (rowErr || !row || !row.social_post_id) {
            return res.status(404).json({ error: 'Published post record not found' });
        }

        if (row.social_provider !== 'facebook') {
            return res.status(400).json({ error: 'Only Facebook insights are supported currently' });
        }

        // 2. Fetch Insights from FB
        const insights = await getFacebookPostInsights(row.companyId, row.social_post_id);
        res.json(insights);

    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
