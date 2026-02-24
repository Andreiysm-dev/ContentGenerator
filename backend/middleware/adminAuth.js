import db from '../database/db.js';

export const adminAuth = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch user profile to check role
        const { data: profile, error } = await db
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return res.status(403).json({ error: 'Forbidden: Profile not found' });
        }

        if (profile.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
