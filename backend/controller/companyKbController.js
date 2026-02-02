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
            imageUserText
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

        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .insert([
                { 
                    brandPack,
                    brandCapability,
                    writerAgent,
                    reviewPrompt1,
                    emojiRule,
                    companyId,
                    systemInstruction,
                    imageSystemPrompt,
                    imageUserText,
                    user_id: userId,

                    created_at: new Date().toISOString()
                }
            ])
            .select();

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
        const { data: brandKBs, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
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

        const { data: brandKBs, error: brandKBError } = await db
            .from('brandKB')
            .select('*')
            .eq('companyId', companyId)
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
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
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
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

        const { 
            brandPack, 
            brandCapability, 
            writerAgent, 
            reviewPrompt1,
            emojiRule, 
            companyId,
            systemInstruction,
            imageSystemPrompt,
            imageUserText
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

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No fields to update' 
            });
        }

        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .update(updateData)
            .eq('brandKbId', id)
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
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

        const { data: brandKB, error: brandKBError } = await db
            .from('brandKB')
            .delete()
            .eq('brandKbId', id)
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
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

        const { data: brandKBs, error: brandKBError } = await db
            .from('brandKB')
            .delete()
            .eq('companyId', companyId)
            .eq('user_id', userId)
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