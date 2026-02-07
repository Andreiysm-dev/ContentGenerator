import db from '../database/db.js';

// CREATE - Add a new brand knowledge base entry
export const createBrandKB = async (req, res) => {
    try {
        const { 
            brandPack, 
            brandCapability, 
            writerAgent, 
            reviewPrompt1,
            emojiRule, 
            companyId, 
            systemInstruction,
            imageSystemPrompt,
            imageUserText,
            form_answer
        } = req.body;
        const userId = req.user?.id;

        // Validate required fields
        if (!companyId) {
            return res.status(400).json({ 
                error: 'Company ID is required' 
            });
        }
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

        const { data: existingBrandKB, error: existingBrandKBError } = await db
            .from('brandKB')
            .select('brandKbId')
            .eq('companyId', companyId)
            .limit(1)
            .maybeSingle();

        if (existingBrandKBError) {
            console.error('Error checking existing brandKB:', existingBrandKBError);
            return res.status(500).json({
                error: 'Failed to check existing brand knowledge base entry',
                details: existingBrandKBError.message,
            });
        }

        const payload = {
            brandPack,
            brandCapability,
            writerAgent,
            reviewPrompt1,
            emojiRule,
            companyId,
            systemInstruction,
            imageSystemPrompt,
            imageUserText,
            form_answer,
            user_id: userId,
        };

        const query = existingBrandKB?.brandKbId
            ? db.from('brandKB').update(payload).eq('brandKbId', existingBrandKB.brandKbId).select()
            : db.from('brandKB').insert([{ ...payload, created_at: new Date().toISOString() }]).select();

        const { data: brandKB, error: brandKBError } = await query;

        if (brandKBError) {
            console.error('Error creating brandKB:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to create brand knowledge base entry',
                details: brandKBError.message 
            });
        }

        return res.status(201).json({ 
            message: 'Brand knowledge base entry created successfully',
            brandKB: brandKB[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get all brand knowledge base entries
export const getAllBrandKBs = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { data: companies, error: companyError } = await db
            .from('company')
            .select('companyId')
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`);

        if (companyError) {
            console.error('Error fetching companies:', companyError);
            return res.status(500).json({
                error: 'Failed to fetch brand knowledge base entries',
                details: companyError.message,
            });
        }

        const companyIds = (companies || []).map((company) => company.companyId);
        if (companyIds.length === 0) {
            return res.status(200).json({ brandKBs: [], count: 0 });
        }

        const { data: brandKBs, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .in('companyId', companyIds)
            .order('created_at', { ascending: false });

        if (brandKBError) {
            console.error('Error fetching brandKBs:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to fetch brand knowledge base entries',
                details: brandKBError.message 
            });
        }

        return res.status(200).json({ 
            brandKBs,
            count: brandKBs.length 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get brand knowledge base entries by company ID
export const getBrandKBsByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

        const { data: brandKBs, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .eq('companyId', companyId)
            .order('created_at', { ascending: false });

        if (brandKBError) {
            console.error('Error fetching brandKBs:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to fetch brand knowledge base entries',
                details: brandKBError.message 
            });
        }

        return res.status(200).json({ 
            brandKBs,
            count: brandKBs.length 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get a single brand knowledge base entry by ID
export const getBrandKBById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .eq('brandKbId', id)
            .single();

        if (brandKBError) {
            if (brandKBError.code === 'PGRST116') {
                return res.status(404).json({ 
                    error: 'Brand knowledge base entry not found' 
                });
            }
            console.error('Error fetching brandKB:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to fetch brand knowledge base entry',
                details: brandKBError.message 
            });
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

        return res.status(200).json({ brandKB });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// UPDATE - Update a brand knowledge base entry by ID
export const updateBrandKB = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: existingRow, error: existingError } = await db
            .from('brandKB')
            .select('companyId')
            .eq('brandKbId', id)
            .single();

        if (existingError || !existingRow) {
            return res.status(404).json({ error: 'Brand knowledge base entry not found' });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', existingRow.companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { 
            brandPack, 
            brandCapability, 
            writerAgent, 
            reviewPrompt1,
            emojiRule, 
            companyId,
            systemInstruction,
            imageSystemPrompt,
            imageUserText,
            form_answer
        } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (brandPack !== undefined) updateData.brandPack = brandPack;
        if (brandCapability !== undefined) updateData.brandCapability = brandCapability;
        if (writerAgent !== undefined) updateData.writerAgent = writerAgent;
        if (reviewPrompt1 !== undefined) updateData.reviewPrompt1 = reviewPrompt1;
        if (emojiRule !== undefined) updateData.emojiRule = emojiRule;
        if (companyId !== undefined) updateData.companyId = companyId;
        if (systemInstruction !== undefined) updateData.systemInstruction = systemInstruction;
        if (imageSystemPrompt !== undefined) updateData.imageSystemPrompt = imageSystemPrompt;
        if (imageUserText !== undefined) updateData.imageUserText = imageUserText;
        if (form_answer !== undefined) updateData.form_answer = form_answer;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No fields to update' 
            });
        }

        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .update(updateData)
            .eq('brandKbId', id)
            .select();

        if (brandKBError) {
            console.error('Error updating brandKB:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to update brand knowledge base entry',
                details: brandKBError.message 
            });
        }

        if (!brandKB || brandKB.length === 0) {
            return res.status(404).json({ 
                error: 'Brand knowledge base entry not found' 
            });
        }

        return res.status(200).json({ 
            message: 'Brand knowledge base entry updated successfully',
            brandKB: brandKB[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// DELETE - Delete a brand knowledge base entry by ID
export const deleteBrandKB = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: existingRow, error: existingError } = await db
            .from('brandKB')
            .select('companyId')
            .eq('brandKbId', id)
            .single();

        if (existingError || !existingRow) {
            return res.status(404).json({ error: 'Brand knowledge base entry not found' });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', existingRow.companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .delete()
            .eq('brandKbId', id)
            .select();

        if (brandKBError) {
            console.error('Error deleting brandKB:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to delete brand knowledge base entry',
                details: brandKBError.message 
            });
        }

        if (!brandKB || brandKB.length === 0) {
            return res.status(404).json({ 
                error: 'Brand knowledge base entry not found' 
            });
        }

        return res.status(200).json({ 
            message: 'Brand knowledge base entry deleted successfully',
            brandKB: brandKB[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// DELETE - Delete all brand knowledge base entries for a company
export const deleteBrandKBsByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

        const { data: brandKBs, error: brandKBError } = await db
            .from('brandKB')
            .delete()
            .eq('companyId', companyId)
            .select();

        if (brandKBError) {
            console.error('Error deleting brandKBs:', brandKBError);
            return res.status(500).json({ 
                error: 'Failed to delete brand knowledge base entries',
                details: brandKBError.message 
            });
        }

        return res.status(200).json({ 
            message: `Deleted ${brandKBs.length} brand knowledge base entries`,
            count: brandKBs.length,
            brandKBs 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};