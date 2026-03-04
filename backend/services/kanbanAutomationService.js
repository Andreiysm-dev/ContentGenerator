import db from '../database/db.js';

/**
 * Maps a frontend action string to an event string used by backend triggers.
 */
const ACTION_TO_EVENT = {
    'generate_caption': 'caption_generated',
    'generate_image': 'image_generated',
    'comment_added': 'comment_added',
    'revision_requested': 'revision_requested',
};

/**
 * Applies kanban automation rules to a content piece based on an event trigger.
 * Supports both:
 *   - Old schema: { event: 'caption_generated', targetStatus: 'Caption Generated' }
 *   - New frontend schema: { type: 'move_to', action: 'generate_caption', targetColumn: 'Caption Generated' }
 *
 * @param {string} companyId 
 * @param {string} event - Trigger event (caption_generated, image_generated, comment_added, revision_requested)
 * @param {string} currentStatus - Fallback status if no rule found
 * @returns {Promise<string>} - The new status to apply
 */
export async function getTargetStatusFromAutomation(companyId, event, currentStatus) {
    if (!companyId) return currentStatus;

    try {
        const { data: company, error } = await db
            .from('company')
            .select('kanban_settings')
            .eq('companyId', companyId)
            .single();

        if (error || !company?.kanban_settings?.automations) {
            console.log(`[KanbanAutomation] No automations found for company ${companyId}`);
            return currentStatus;
        }

        const automations = company.kanban_settings.automations;
        console.log(`[KanbanAutomation] Looking for event="${event}" in automations:`, JSON.stringify(automations));

        // Try old schema first: { event, targetStatus }
        const oldRule = automations.find(r => r.event === event);
        if (oldRule?.targetStatus) {
            console.log(`[KanbanAutomation] Matched old-schema rule, targetStatus="${oldRule.targetStatus}"`);
            return oldRule.targetStatus;
        }

        // Try new frontend schema: { type: 'move_to', action, targetColumn }
        // Map the incoming event back to the action name the frontend uses
        const eventToAction = Object.fromEntries(
            Object.entries(ACTION_TO_EVENT).map(([action, ev]) => [ev, action])
        );
        const actionName = eventToAction[event];
        if (actionName) {
            const newRule = automations.find(r =>
                r.type === 'move_to' && r.action === actionName && r.targetColumn
            );
            if (newRule?.targetColumn) {
                console.log(`[KanbanAutomation] Matched new-schema rule, targetColumn="${newRule.targetColumn}"`);
                return newRule.targetColumn;
            }
        }

        console.log(`[KanbanAutomation] No matching rule found for event="${event}", returning currentStatus="${currentStatus}"`);
    } catch (err) {
        console.error('Failed to apply kanban automation:', err);
    }

    return currentStatus;
}
