import { createAuthClient, supabase } from '../database/db.js';

// In-memory cache for system settings and profiles to reduce DB load
const cache = {
  maintenanceMode: { value: null, lastFetched: 0 },
  profiles: new Map(), // userId -> { role, last_seen, expiresAt }
};

const MAINTENANCE_CACHE_TTL = 60 * 1000; // 1 minute
const PROFILE_CACHE_TTL = 30 * 1000;    // 30 seconds
const LAST_SEEN_THROTTLE = 15 * 60 * 1000; // 15 minutes

const getMaintenanceMode = async () => {
  const now = Date.now();
  if (cache.maintenanceMode.value !== null && (now - cache.maintenanceMode.lastFetched < MAINTENANCE_CACHE_TTL)) {
    return cache.maintenanceMode.value;
  }

  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    const value = data?.value === true || data?.value === 'true';
    cache.maintenanceMode = { value, lastFetched: now };
    return value;
  } catch (err) {
    console.error('Failed to fetch maintenance mode:', err);
    return cache.maintenanceMode.value || false; // Fallback to last known or false
  }
};

const getCachedProfile = async (userId) => {
  const now = Date.now();
  const cached = cache.profiles.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, last_seen')
    .eq('id', userId)
    .single();

  if (profile) {
    const profileData = { ...profile, expiresAt: now + PROFILE_CACHE_TTL };
    cache.profiles.set(userId, profileData);
    return profileData;
  }
  return null;
};

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
};

const authMiddleware = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  if (req.path === '/auth/linkedin/callback' || req.path === '/auth/facebook/callback') {
    return next();
  }

  try {
    // 1. Check Maintenance Mode (Cached)
    const isMaintenance = await getMaintenanceMode();

    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const authClient = createAuthClient(token);
    const { data, error } = await authClient.auth.getUser();
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid auth token' });

    req.user = data.user;

    // 2. Fetch/Check Profile (Cached)
    const profile = await getCachedProfile(req.user.id);

    // 3. Throttle last_seen update (15 mins)
    const now = new Date();
    const lastSeen = profile?.last_seen ? new Date(profile.last_seen) : null;
    if (!lastSeen || (now.getTime() - lastSeen.getTime() > LAST_SEEN_THROTTLE)) {
      supabase
        .from('profiles')
        .update({ last_seen: now.toISOString() })
        .eq('id', req.user.id)
        .then(() => {
          // Update cache immediately so we don't try to update DB again in the next request
          if (cache.profiles.has(req.user.id)) {
            const current = cache.profiles.get(req.user.id);
            cache.profiles.set(req.user.id, { ...current, last_seen: now.toISOString() });
          }
        });
    }

    // 4. Maintenance Logic
    if (isMaintenance && profile?.role !== 'ADMIN') {
      return res.status(503).json({
        error: 'System is currently undergoing maintenance. Please try again later.',
        maintenance: true
      });
    }

    // 5. Impersonation (Admin Only)
    const impersonateId = req.headers['x-impersonate-user'];
    if (impersonateId && impersonateId !== req.user.id) {
      if (profile?.role === 'ADMIN') {
        req.originalUser = req.user;
        req.user = {
          ...req.user,
          id: impersonateId,
          isImpersonated: true,
          originalId: req.user.id
        };
      }
    }

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export default authMiddleware;
