import db from '../database/db.js';
import { processDmpChat } from '../services/dmpChatService.js';

export const handleDmpChat = async (req, res) => {
    try {
        const { message, currentDmp } = req.body;
        const { contentCalendarId } = req.params;
        const userId = req.user?.id;

        if (!contentCalendarId || !message) {
            return res.status(400).json({ error: 'Content Calendar ID and message are required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Fetch the row and verify access
        const { data: row, error: rowError } = await db
            .from('contentCalendar')
            .select('companyId, dmp')
            .eq('contentCalendarId', contentCalendarId)
            .single();

        if (rowError || !row) {
            return res.status(404).json({ error: 'Content calendar entry not found' });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', row.companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 2. Process chat
        // Use currentDmp from body if provided (might be draft in frontend), else fallback to DB
        const dmpToUse = currentDmp !== undefined ? currentDmp : row.dmp;
        const result = await processDmpChat({ currentDmp: dmpToUse, message });

        if (!result.ok) {
            return res.status(500).json({ error: result.error });
        }

        // we don't necessarily want to SAVE it immediately to the DB as it might be a draft 
        // that the user hasn't "Saved & Generated" yet.
        // However, for consistency with Brand Core assistant, we could.
        // The user said "update the megaprompt", so I'll return the updated DMP for the frontend to handle.
        // If we want to persist it immediately, we can do an update here.
        // Let's persist it to keep it simple and consistent with the user's previous request.

        const { error: updateError } = await db
            .from('contentCalendar')
            .update({ dmp: result.updatedDmp })
            .eq('contentCalendarId', contentCalendarId);

        if (updateError) {
            console.error('Failed to update DMP from chat:', updateError);
            return res.status(500).json({ error: 'AI proposed update but failed to save it.' });
        }

        return res.status(200).json({
            response: result.response,
            updatedDmp: result.updatedDmp
        });

    } catch (error) {
        console.error('DMP Chat Controller Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
