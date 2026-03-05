
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
            .select('user_id, collaborator_ids, companyName')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) {
            console.error('[Notification] Error fetching company team:', companyError);
            return;
        }

        const finalCompanyName = companyName || company.companyName || 'Company';

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
                company_name: finalCompanyName,
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

export const sendRoleNotification = async ({ companyId, roleName, title, message, type = 'info', link = null, triggeredByName = null, companyName = null }) => {
    if (!companyId) return;

    try {
        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids, collaborator_roles, companyName')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) return;

        const finalCompanyName = companyName || company.companyName || 'Company';

        const teamIds = new Set();
        // Add owner
        if (company.user_id) teamIds.add(company.user_id);

        // Add collaborators with specific role
        if (roleName && company.collaborator_roles) {
            const collaborators = Object.entries(company.collaborator_roles)
                .filter(([_, role]) => role === roleName)
                .map(([userId, _]) => userId);

            collaborators.forEach(id => teamIds.add(id));
        }

        if (teamIds.size === 0) return;

        const notifications = Array.from(teamIds).map(userId => ({
            user_id: userId,
            title,
            message,
            type,
            link,
            triggered_by_name: triggeredByName,
            company_name: finalCompanyName,
            read: false,
        }));

        const { error } = await db
            .from('notifications')
            .insert(notifications);

        if (error) console.error('[Notification] Error inserting role notifications:', error);
    } catch (error) {
        console.error('[Notification] Error in sendRoleNotification:', error);
    }
};

/**
 * Checks if a status belongs to a locked column and notifies the designated role + owner if it does.
 */
export const checkAndNotifyApproval = async ({ companyId, status, contentTheme, triggeredByName, userId }) => {
    if (!companyId || !status) return;

    try {
        const { data: company, error } = await db
            .from('company')
            .select('companyName, kanban_settings')
            .eq('companyId', companyId)
            .single();

        if (error || !company) return;

        const automations = company.kanban_settings?.automations;
        if (!automations) return;

        const stateSrt = (typeof status === 'object' ? status.state : status) || '';
        const lockRule = automations.find(a => a.type === 'access_rule' && a.columnId === stateSrt);

        if (lockRule) {
            // If triggeredByName is not provided, fetch it
            let finalTriggerName = triggeredByName;
            if (!finalTriggerName && userId) {
                const { data: profile } = await db.from('profiles').select('full_name, email').eq('id', userId).single();
                finalTriggerName = profile?.full_name || profile?.email || 'A team member';
            }

            await sendRoleNotification({
                companyId,
                roleName: lockRule.roleName,
                title: 'Approval Needed',
                message: `Content "${contentTheme || 'Untitled'}" moved to ${stateSrt}. Your approval is required.`,
                type: 'warning',
                link: `/company/${companyId}/calendar`,
                triggeredByName: finalTriggerName || 'System',
                companyName: company.companyName || 'Company'
            });
        }
    } catch (err) {
        console.error('[Notification] Error in checkAndNotifyApproval:', err);
    }
};

/**
 * Notifies users who have specifically opted-in to watch a column.
 */
export const notifyWatchers = async ({ companyId, status, contentTheme, triggeredByUserId }) => {
    if (!companyId || !status) return;

    try {
        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids, companyName, kanban_settings')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) return;

        const allPotentialUserIds = [company.user_id, ...(company.collaborator_ids || [])];
        const stateStr = (typeof status === 'object' ? status.state || status : status).toString();

        // 1. Fetch user metadata for all team members using admin client
        // Note: For large teams, this might need optimization/batching
        const { data: { users }, error: authError } = await db.auth.admin.listUsers();
        if (authError || !users) return;

        const teamAuthUsers = users.filter(u => allPotentialUserIds.includes(u.id));
        const notificationPayloads = [];

        // 2. Fetch triggering user's name
        let triggeredByName = 'A team member';
        if (triggeredByUserId) {
            const triggeringUser = users.find(u => u.id === triggeredByUserId);
            triggeredByName = triggeringUser?.user_metadata?.full_name || triggeringUser?.email || triggeredByName;
        }

        for (const user of teamAuthUsers) {
            // Don't notify the person who made the change
            if (user.id === triggeredByUserId) continue;

            const prefs = user.user_metadata?.notification_preferences?.[companyId]?.watchedColumns || {};

            // Find the readable title for the current status inside company settings for better matching
            let columnTitle = stateStr;
            const columns = company.kanban_settings?.columns || [];
            const colDef = columns.find(c => c.id === stateStr || c.title === stateStr);
            if (colDef) {
                columnTitle = colDef.title;
            }

            // Match by ID OR by Title (just in case)
            const isWatching = (prefs[stateStr] === true) || (colDef && prefs[colDef.id] === true) || (prefs[columnTitle] === true);

            if (isWatching) {
                notificationPayloads.push({
                    user_id: user.id,
                    title: 'Column Update',
                    message: `"${contentTheme || 'Untitled'}" moved to ${columnTitle}.`,
                    type: 'info',
                    link: `/company/${companyId}/calendar`,
                    triggered_by_name: triggeredByName,
                    company_name: company.companyName || 'Company',
                    read: false
                });
            }
        }

        if (notificationPayloads.length > 0) {
            await db.from('notifications').insert(notificationPayloads);
        }
    } catch (err) {
        console.error('[Notification] Error in notifyWatchers:', err);
    }
};
