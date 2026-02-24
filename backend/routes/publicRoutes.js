import express from 'express';
import db from '../database/db.js';

const router = express.Router();

/**
 * GET /api/public/settings
 * Fetches non-sensitive system settings (announcements, maintenance mode)
 */
router.get('/settings', async (req, res) => {
    try {
        const { data, error } = await db
            .from('system_settings')
            .select('key, value')
            .in('key', ['maintenance_mode', 'system_announcement']);

        if (error) {
            console.error('Error fetching public settings:', error);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }

        const settings = data.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return res.status(200).json({ settings });
    } catch (error) {
        console.error('Unexpected error in public settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
