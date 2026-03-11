import express from 'express';
import { supabase as supabaseAdmin } from '../database/db.js';
import axios from 'axios';
import crypto from 'crypto';

// --- OAuth State Helpers ---
// Signs the state payload with HMAC-SHA256 so it cannot be tampered with.
// Format: base64(payload).hmacSignature
const signOAuthState = (payload) => {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-oauth-secret';
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
    return `${encoded}.${sig}`;
};

// Verifies the HMAC signature and returns the decoded payload, or null if invalid.
const verifyOAuthState = (state) => {
    try {
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-oauth-secret';
        const [encoded, sig] = state.split('.');
        if (!encoded || !sig) return null;
        const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
        // Constant-time comparison to prevent timing attacks
        const sigBuffer = Buffer.from(sig, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');
        if (sigBuffer.length !== expectedBuffer.length) return null;
        if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;
        return JSON.parse(Buffer.from(encoded, 'base64url').toString());
    } catch {
        return null;
    }
};

const router = express.Router();

// --- Helper: Get Base URL ---
const getRedirectUri = () => {
    // In production, this should be the production URL. 
    // For now, defaulting to localhost for dev.
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/api/auth/linkedin/callback`;
};

const LINKEDIN_SCOPES = ['profile', 'email', 'w_member_social', 'openid'];
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';
const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const FACEBOOK_PAGE_ACCOUNTS_URL = 'https://graph.facebook.com/v18.0/me/accounts';
const FACEBOOK_SCOPES = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'public_profile'
];

// 1. GET /api/auth/linkedin/connect?companyId=...
// Initiates the OAuth flow
router.get('/auth/linkedin/connect', (req, res) => {
    const { companyId } = req.query;
    const user = req.user; // From authMiddleware

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!companyId) {
        return res.status(400).json({ error: 'Missing companyId' });
    }

    // Generate HMAC-signed state to prevent CSRF attacks.
    // nonce uses crypto.randomBytes for cryptographic strength.
    const signedState = signOAuthState({
        companyId,
        userId: user.id,
        nonce: crypto.randomBytes(16).toString('hex')
    });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: getRedirectUri(),
        state: signedState,
        scope: LINKEDIN_SCOPES.join(' '),
    });

    const url = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
    res.json({ url }); // Return the URL for frontend to redirect
});

// 2. GET /api/auth/linkedin/callback
// Handles the redirect from LinkedIn
router.get('/auth/linkedin/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('LinkedIn OAuth Error:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=linkedin_auth_failed`);
    }

    try {
        // Verify the HMAC-signed state to prevent CSRF / state tampering
        const decodedState = verifyOAuthState(state);
        if (!decodedState) {
            console.error('LinkedIn OAuth: Invalid or tampered state parameter');
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=linkedin_invalid_state`);
        }
        const { companyId, userId } = decodedState;

        // Exchange code for Access Token
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: getRedirectUri(),
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Fetch User Profile (to get name and ID)
        const profileResponse = await axios.get(LINKEDIN_PROFILE_URL, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        // LinkedIn API v2 /userinfo structure: { sub: 'id', name: 'Name', picture: 'url' }
        const { sub: providerAccountId, name, picture } = profileResponse.data;

        // Calculate expiry
        const expiresAt = new Date(Date.now() + expires_in * 1000);

        // Save to DB (upsert)
        // Using supabaseAdmin (service role) because valid user session might not be present in callback context easily, 
        // or to simplify permissions.
        const { error: dbError } = await supabaseAdmin
            .from('social_accounts')
            .upsert({
                company_id: companyId,
                provider: 'linkedin',
                provider_account_id: providerAccountId,
                access_token,
                refresh_token,
                expires_at: expiresAt.toISOString(),
                profile_name: name,
                profile_picture: picture,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'company_id, provider, provider_account_id' });

        if (dbError) {
            console.error('DB Error saving social account:', dbError);
            throw new Error('Failed to save account');
        }

        // Redirect back to settings
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/company/${companyId}/settings/integrations?success=linkedin_connected`);

    } catch (err) {
        console.error('LinkedIn Callback Error:', err.response?.data || err.message);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=linkedin_connection_error`);
    }
});

// --- Facebook Endpoints ---

// 3. GET /api/auth/facebook/connect?companyId=...
router.get('/auth/facebook/connect', (req, res) => {
    const { companyId } = req.query;
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!companyId) return res.status(400).json({ error: 'Missing companyId' });

    // Generate HMAC-signed state to prevent CSRF attacks.
    const encodedState = signOAuthState({
        companyId,
        userId: user.id,
        nonce: crypto.randomBytes(16).toString('hex')
    });

    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        state: encodedState,
        scope: FACEBOOK_SCOPES.join(','),
        response_type: 'code'
    });

    const url = `${FACEBOOK_AUTH_URL}?${params.toString()}`;
    res.json({ url }); // Return the URL for frontend to redirect
});

// 4. GET /api/auth/facebook/callback
router.get('/auth/facebook/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('Facebook OAuth Error:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=facebook_auth_failed`);
    }

    try {
        // Verify the HMAC-signed state to prevent CSRF / state tampering
        const decodedState = verifyOAuthState(state);
        if (!decodedState) {
            console.error('Facebook OAuth: Invalid or tampered state parameter');
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=facebook_invalid_state`);
        }
        const { companyId } = decodedState;

        // A. Exchange code for User Access Token
        const tokenResponse = await axios.get(FACEBOOK_TOKEN_URL, {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                code
            }
        });

        const { access_token: userAccessToken } = tokenResponse.data;

        // B. Fetch Pages managed by the user
        const pagesResponse = await axios.get(FACEBOOK_PAGE_ACCOUNTS_URL, {
            params: { access_token: userAccessToken, fields: 'id,name,picture,access_token' }
        });

        const pages = pagesResponse.data.data; // Array of pages

        if (!pages || pages.length === 0) {
            console.warn('No Facebook Pages found for user');
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/company/${companyId}/settings/integrations?error=facebook_no_pages`);
        }

        // C. Save each page to index. 
        // Note: For Facebook, we store the PAGE ID and PAGE ACCESS TOKEN.
        for (const page of pages) {
            const { error: dbError } = await supabaseAdmin
                .from('social_accounts')
                .upsert({
                    company_id: companyId,
                    provider: 'facebook',
                    provider_account_id: page.id,
                    access_token: page.access_token, // This is the Page-specific token
                    profile_name: page.name,
                    profile_picture: page.picture?.data?.url,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'company_id, provider, provider_account_id' });

            if (dbError) {
                console.error('DB Error saving FB account:', dbError);
            }
        }

        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/company/${companyId}/settings/integrations?success=facebook_connected`);

    } catch (err) {
        console.error('Facebook Callback Error:', err.response?.data || err.message);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=facebook_connection_error`);
    }
});

export default router;
