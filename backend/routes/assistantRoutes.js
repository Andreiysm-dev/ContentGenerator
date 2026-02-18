import express from 'express';
import { processAssistantChat } from '../services/assistantService.js';
import db from '../database/db.js';

const router = express.Router();

router.post('/assistant/chat', async (req, res) => {
    const { message, history, currentPage, extraContext } = req.body;
    const userId = req.user?.id;
    const companyId = req.headers['x-company-id'];

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!companyId) {
        return res.status(400).json({ error: 'Active company context required' });
    }

    const result = await processAssistantChat({
        userId,
        companyId,
        message,
        history,
        currentPage,
        extraContext
    });

    if (result.ok) {
        // Handle Side Effects (Auto-Apply Updates)
        try {
            if (result.intent === 'UPDATE_BRAND' && result.payload) {
                // Determine brandKB ID
                const { data: brandKB } = await db.from('brandKB').select('brandKbId').eq('companyId', companyId).single();
                if (brandKB) {
                    await db.from('brandKB').update(result.payload).eq('brandKbId', brandKB.brandKbId);
                }
            } else if (result.intent === 'UPDATE_DMP' && result.payload) {
                // Determine targeted content item
                const targetId = extraContext?.selectedRow?.contentCalendarId;
                if (targetId) {
                    await db.from('contentCalendar').update({
                        dmp: result.payload.updatedDmp
                    }).eq('contentCalendarId', targetId);
                }
            }
        } catch (updateError) {
            console.error('Assistant Intent Update Error:', updateError);
            // We still return the AI message even if the background update failed
        }

        res.json(result);
    } else {
        res.status(500).json({ error: result.error });
    }
});

export default router;
