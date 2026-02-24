import db from '../database/db.js';

/**
 * Logs a system action for audit purposes
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Descriptive name of the action (e.g., 'COMPANY_DELETE')
 * @param {string} entityType - Type of entity affected (e.g., 'company')
 * @param {string} entityId - ID of the affected entity
 * @param {object} metadata - Additional context/data
 */
export const logAudit = async (userId, action, entityType, entityId, metadata = {}) => {
    try {
        const { error } = await db
            .from('audit_logs')
            .insert({
                user_id: userId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                metadata
            });

        if (error) {
            console.error('Failed to write audit log:', error);
        }
    } catch (err) {
        console.error('Unexpected error writing audit log:', err);
    }
};

export default { logAudit };
