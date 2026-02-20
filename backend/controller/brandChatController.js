import db from '../database/db.js';
import { processBrandChat } from '../services/brandChatService.js';

/**
 * Handle Brand Chat
 * Refines brand knowledge base fields via AI conversation
 */
export const handleBrandChat = async (req, res) => {
    try {
        const { message, currentBrandData, history } = req.body;
        const { id: brandKbId } = req.params;
        const userId = req.user?.id;

        if (!brandKbId || !message) {
            return res.status(400).json({ error: 'Brand KB ID and message are required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Fetch the row and verify access
        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .eq('brandKbId', brandKbId)
            .single();

        if (brandKBError || !brandKB) {
            return res.status(404).json({ error: 'Brand knowledge base entry not found' });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', brandKB.companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 2. Process chat
        // Use currentBrandData from body if provided (might be draft in frontend), else fallback to DB
        const dataToUse = currentBrandData || {
            brandPack: brandKB.brandPack,
            brandCapability: brandKB.brandCapability,
            writerAgent: brandKB.writerAgent,
            reviewPrompt1: brandKB.reviewPrompt1,
            systemInstruction: brandKB.systemInstruction,
            emojiRule: brandKB.emojiRule
        };

        const result = await processBrandChat({ currentBrandData: dataToUse, message, history });

        if (!result.ok) {
            return res.status(500).json({ error: result.error });
        }

        // 3. Persist the changes
        const updatePayload = {};
        const fields = ['brandPack', 'brandCapability', 'writerAgent', 'reviewPrompt1', 'systemInstruction', 'emojiRule'];

        let hasChanges = false;
        for (const field of fields) {
            if (result.updatedFields[field] !== null && result.updatedFields[field] !== undefined) {
                updatePayload[field] = result.updatedFields[field];
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const { error: updateError } = await db
                .from('brandKB')
                .update(updatePayload)
                .eq('brandKbId', brandKbId);

            if (updateError) {
                console.error('Failed to update Brand KB from chat:', updateError);
                return res.status(500).json({ error: 'AI proposed update but failed to save it.' });
            }
        }

        return res.status(200).json({
            response: result.response,
            updatedFields: result.updatedFields,
            brandKB: { ...brandKB, ...updatePayload }
        });

    } catch (error) {
        console.error('Brand Chat Controller Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
