import { createAuthClient } from '../database/db.js';

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const supabase = createAuthClient(token);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    req.user = data.user;
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export default authMiddleware;
