import { createAuthClient, supabase } from '../database/db.js';

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
};

const authMiddleware = async (req, res, next) => {
  // Allow preflight requests to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Allow OAuth callbacks to pass through (browser redirect doesn't have auth header)
  if (req.path === '/auth/linkedin/callback' || req.path === '/auth/facebook/callback') {
    return next();
  }

  try {
    // Maintenance Mode Check
    const { data: maintenanceSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    const isMaintenance = maintenanceSetting?.value === true || maintenanceSetting?.value === 'true';

    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const authClient = createAuthClient(token);
    const { data, error } = await authClient.auth.getUser();
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    req.user = data.user;

    // Fetch profile for role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    // Block non-admins if maintenance is ON
    if (isMaintenance && profile?.role !== 'ADMIN') {
      return res.status(503).json({
        error: 'System is currently undergoing maintenance. Please try again later.',
        maintenance: true
      });
    }

    // Impersonation Support
    const impersonateId = req.headers['x-impersonate-user'];
    if (impersonateId && impersonateId !== req.user.id) {
      if (profile?.role === 'ADMIN') {
        req.originalUser = req.user;
        // Construct a pseudo-user object for the target
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
