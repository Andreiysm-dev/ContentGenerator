
import db from '../database/db.js';

export const sendNotification = async ({ userId, title, message, type = 'info', link = null, triggeredByName = null, companyName = null }) => {
    if (!userId) {
        console.warn('[Notification] Skipped: No userId provided');
        return;
    }

    try {
        const { error } = await db
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type,
                link,
                triggered_by_name: triggeredByName,
                company_name: companyName,
                read: false,
            }]);

        if (error) {
            console.error('[Notification] Failed to create notification:', error);
        }
    } catch (err) {
        console.error('[Notification] Error sending notification:', err);
    }
};
