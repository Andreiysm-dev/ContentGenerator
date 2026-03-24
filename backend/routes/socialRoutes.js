import express from 'express';
import { supabase } from '../database/db.js';
import authMiddleware from '../middleware/auth.js';
import { postToLinkedIn, postToFacebookPage, getFacebookPostInsights } from '../services/socialService.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

async function verifyCompanyAccess(companyId, userId) {
    const { data: company, error: companyError } = await supabase
        .from('company')
        .select('user_id, collaborator_ids')
        .eq('companyId', companyId)
        .single();

    if (companyError || !company) {
        return { ok: false, status: 404, error: 'Company not found' };
    }

    if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
        return { ok: false, status: 403, error: 'Forbidden' };
    }

    return { ok: true, company };
}

// GET /api/social/:companyId/accounts - List connected accounts
router.get('/social/:companyId/accounts', async (req, res) => {
    const { companyId } = req.params;
    const user = req.user;

    try {
        const access = await verifyCompanyAccess(companyId, user.id);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
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

// GET /api/social/:companyId/analytics-summary - Real account + published post adapter for the Analytics Hub
router.get('/social/:companyId/analytics-summary', async (req, res) => {
    const { companyId } = req.params;
    const user = req.user;

    try {
        const access = await verifyCompanyAccess(companyId, user.id);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }

        const [{ data: accounts, error: accountsError }, { data: posts, error: postsError }] = await Promise.all([
            supabase
                .from('social_accounts')
                .select('id, provider, profile_name, profile_picture, created_at')
                .eq('company_id', companyId)
                .order('created_at', { ascending: true }),
            supabase
                .from('contentCalendar')
                .select('contentCalendarId, card_name, theme, brandHighlight, finalCaption, captionOutput, date, scheduled_at, imageGenerated, imageGeneratedUrl, social_provider, social_account_id, social_post_id, created_at')
                .eq('companyId', companyId)
                .eq('status', 'PUBLISHED')
                .order('date', { ascending: false }),
        ]);

        if (accountsError) throw accountsError;
        if (postsError) throw postsError;

        const safeAccounts = (accounts || []).map((acc) => ({
            id: acc.id,
            provider: acc.provider,
            profile_name: acc.profile_name,
            profile_picture: acc.profile_picture,
            created_at: acc.created_at,
        }));

        const mappedPosts = (posts || []).map((post) => ({
            contentCalendarId: post.contentCalendarId,
            card_name: post.card_name,
            theme: post.theme,
            brandHighlight: post.brandHighlight,
            finalCaption: post.finalCaption,
            captionOutput: post.captionOutput,
            date: post.date,
            scheduled_at: post.scheduled_at,
            imageGenerated: post.imageGenerated,
            imageGeneratedUrl: post.imageGeneratedUrl,
            social_provider: post.social_provider,
            social_account_id: post.social_account_id,
            social_post_id: post.social_post_id,
            created_at: post.created_at,
        }));

        const availability = ['facebook', 'instagram', 'linkedin'].map((platform) => {
            const connected = safeAccounts.some((account) => String(account.provider || '').toLowerCase() === platform);
            return {
                platform,
                connected,
                dataStatus: platform === 'linkedin'
                    ? (connected ? 'live-ready' : 'not-connected')
                    : (connected ? 'limited' : 'not-connected'),
                reason: platform === 'linkedin'
                    ? (connected ? 'Connected account ready for live analytics wiring.' : 'No connected account yet.')
                    : (connected ? 'Connected, but provider analytics access is currently limited by verification state.' : 'No connected account yet.'),
            };
        });

        return res.status(200).json({
            companyId,
            accounts: safeAccounts,
            publishedPosts: mappedPosts,
            availability,
            fetchedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
});

// POST /api/social/:companyId/publish
router.post('/social/:companyId/publish', async (req, res) => {
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
                    social_account_id: accountId,
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

// DELETE /api/social/:companyId/accounts/:accountId - Disconnect an account
router.delete('/social/:companyId/accounts/:accountId', async (req, res) => {
    const { companyId, accountId } = req.params;
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

        // 2. Delete the account
        const { error: deleteError } = await supabase
            .from('social_accounts')
            .delete()
            .eq('id', accountId)
            .eq('company_id', companyId);

        if (deleteError) throw deleteError;

        res.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting social account:', error);
        res.status(500).json({ error: 'Failed to disconnect social account' });
    }
});

export default router;
