import db from '../database/db.js';
import { processBrandChat } from '../services/brandChatService.js';

export const handleBrandChat = async (req, res) => {
    try {
        const { companyId, message } = req.body;
        const userId = req.user?.id;

        if (!companyId || !message) {
            return res.status(400).json({ error: 'Company ID and message are required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Verify access
        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 2. Fetch current brand KB
        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .eq('companyId', companyId)
            .maybeSingle();

        if (brandKBError) {
            return res.status(500).json({ error: 'Failed to fetch brand knowledge base' });
        }

        if (!brandKB) {
            return res.status(404).json({ error: 'Brand knowledge base not found for this company. Please complete basic setup first.' });
        }

        // 3. Process chat
        const result = await processBrandChat({ brandKB, message });

        if (!result.ok) {
            return res.status(500).json({ error: result.error });
        }

        // 4. If there are updates, apply them
        let updatedBrandKB = brandKB;
        if (result.updates && Object.keys(result.updates).length > 0) {
            const updatePayload = {};
            // Only update fields that are provided and not null
            for (const [key, value] of Object.entries(result.updates)) {
                if (value !== null && value !== undefined) {
                    updatePayload[key] = value;
                }
            }

            if (Object.keys(updatePayload).length > 0) {
                const { data: updated, error: updateError } = await db
                    .from('brandKB')
                    .update(updatePayload)
                    .eq('brandKbId', brandKB.brandKbId)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Failed to update brandKB from chat:', updateError);
                    // We still return the response, but maybe with a warning? 
                    // For now, let's just fail or ignore? 
                    // Better to return the error so user knows it didn't save.
                    return res.status(500).json({ error: 'AI proposed updates but failed to save them.' });
                }
                updatedBrandKB = updated;
            }
        }

        return res.status(200).json({
            response: result.response,
            updatesApplied: Object.keys(result.updates).length > 0,
            brandKB: updatedBrandKB
        });

    } catch (error) {
        console.error('Brand Chat Controller Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
