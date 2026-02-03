import express from 'express';
import db, { createAuthClient } from '../database/db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const facebookAuthBase = 'https://www.facebook.com/v19.0/dialog/oauth';
const facebookTokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token';

router.get('/facebook/connect', async (req, res) => {
  try {
    const token =
      typeof req.query.token === 'string'
        ? req.query.token
        : (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).send('Missing auth token');
    }

    const supabase = createAuthClient(token);
    const { data, error } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) {
      console.error('Facebook connect auth failed', error);
      return res.status(401).send('Unauthorized');
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    if (!appId || !redirectUri) {
      return res.status(500).send('Facebook app credentials are not configured.');
    }

    const scope = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state: userId,
    });

    return res.redirect(`${facebookAuthBase}?${params.toString()}`);
  } catch (err) {
    console.error('Facebook connect error', err);
    return res.status(500).send('Failed to start Facebook connect.');
  }
});

router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = typeof state === 'string' ? state : null;

    if (!code || typeof code !== 'string') {
      return res.status(400).send('Missing Facebook auth code.');
    }

    if (!userId) {
      return res.status(400).send('Missing user context in state.');
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return res.status(500).send('Facebook app credentials are not configured.');
    }

    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(`${facebookTokenUrl}?${tokenParams.toString()}`);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('Facebook token exchange failed', tokenData);
      return res.status(500).send('Failed to exchange Facebook token.');
    }

    const expiresIn = Number(tokenData.expires_in ?? 0);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { error: upsertError } = await db
      .from('social_connections')
      .upsert(
        {
          user_id: userId,
          provider: 'facebook',
          access_token: tokenData.access_token,
          token_type: tokenData.token_type ?? null,
          expires_at: expiresAt,
          scope: tokenData.scope ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );

    if (upsertError) {
      console.error('Failed to store Facebook token', upsertError);
      return res.status(500).send('Failed to store Facebook token.');
    }

    return res.send('Facebook connected. You can close this window.');
  } catch (err) {
    console.error('Facebook callback error', err);
    return res.status(500).send('Facebook connection failed.');
  }
});

router.get('/facebook/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await db
      .from('social_connections')
      .select('id, provider, expires_at, created_at, updated_at')
      .eq('user_id', userId)
      .eq('provider', 'facebook')
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch Facebook status', error);
      return res.status(500).json({ error: 'Failed to fetch status' });
    }

    return res.json({ connected: Boolean(data), connection: data ?? null });
  } catch (err) {
    console.error('Facebook status error', err);
    return res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
