
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

export const sendTeamNotification = async ({ companyId, title, message, type = 'info', link = null, triggeredByName = null, companyName = null }) => {
    if (!companyId) {
        console.warn('[Notification] Skipped: No companyId provided');
        return;
    }

    try {
        // Fetch owner and collaborators
        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) {
            console.error('[Notification] Error fetching company team:', companyError);
            return;
        }

        const potentialTeamIds = new Set([company.user_id, ...(company.collaborator_ids || [])]);

        // Filter valid user IDs by checking profiles table
        const { data: validProfiles, error: profilesError } = await db
            .from('profiles')
            .select('id')
            .in('id', Array.from(potentialTeamIds));

        if (profilesError) {
            console.error('[Notification] Error verifying valid users:', profilesError);
            return;
        }

        const validUserIds = new Set((validProfiles || []).map(p => p.id));

        const notifications = Array.from(potentialTeamIds)
            .filter(userId => validUserIds.has(userId))
            .map(userId => ({
                user_id: userId,
                title,
                message,
                type,
                link,
                triggered_by_name: triggeredByName,
                company_name: companyName,
                read: false,
            }));

        if (notifications.length === 0) {
            console.warn('[Notification] Skipped: No valid users found in team');
            return;
        }

        const { error } = await db
            .from('notifications')
            .insert(notifications);

        if (error) {
            console.error('[Notification] Error inserting team notifications:', error);
        }
    } catch (error) {
        console.error('[Notification] Unexpected error in sendTeamNotification:', error);
    }
};
