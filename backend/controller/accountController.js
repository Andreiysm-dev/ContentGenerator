import db from '../database/db.js';

/**
 * DELETE /api/account
 * Delete the authenticated user's account and all companies they own
 */
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 1. Fetch all companies owned by this user
        const { data: ownedCompanies, error: fetchError } = await db
            .from('company')
            .select('companyId, companyName')
            .eq('user_id', userId);

        if (fetchError) {
            console.error('Error fetching owned companies:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch companies' });
        }

        const companyIds = ownedCompanies?.map(c => c.companyId) || [];

        // 2. Delete all content calendar entries for owned companies
        if (companyIds.length > 0) {
            const { error: calendarError } = await db
                .from('contentCalendar')
                .delete()
                .in('companyId', companyIds);

            if (calendarError) {
                console.error('Error deleting content calendar:', calendarError);
                // Continue anyway - we want to delete what we can
            }

            // 3. Delete all brand KB entries for owned companies
            const { error: brandKbError } = await db
                .from('brandKB')
                .delete()
                .in('companyId', companyIds);

            if (brandKbError) {
                console.error('Error deleting brand KB:', brandKbError);
                // Continue anyway
            }

            // 4. Delete all companies
            const { error: companyError } = await db
                .from('company')
                .delete()
                .in('companyId', companyIds);

            if (companyError) {
                console.error('Error deleting companies:', companyError);
                return res.status(500).json({ error: 'Failed to delete companies' });
            }
        }

        // 5. Delete the user's profile
        const { error: profileError } = await db
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            // Continue anyway - profile deletion is optional
        }

        // 6. Delete the user via Supabase Admin API
        try {
            const { data: deleteData, error: authError } = await db.auth.admin.deleteUser(userId);

            if (authError) {
                console.error('Error deleting user from auth:', authError);
                // If we can't delete from auth, still return success for the data deletion
                // The user can contact support to fully remove their auth account
                console.warn('User data deleted but auth account remains. User ID:', userId);
            }
        } catch (adminError) {
            console.error('Admin API not available or error:', adminError);
            // Continue - data is deleted even if auth deletion fails
        }

        return res.json({
            success: true,
            companiesDeleted: companyIds.length,
            companyNames: ownedCompanies?.map(c => c.companyName) || []
        });

    } catch (error) {
        console.error('Account deletion error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/account/companies
 * Get list of companies owned by the authenticated user
 */
export const getOwnedCompanies = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: companies, error } = await db
            .from('company')
            .select('companyId, companyName')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching companies:', error);
            return res.status(500).json({ error: 'Failed to fetch companies' });
        }

        return res.json({
            companies: companies || [],
            count: companies?.length || 0
        });

    } catch (error) {
        console.error('Get owned companies error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/company/:companyId/transfer-ownership
 * Transfer ownership of a company to a collaborator
 */
export const transferOwnership = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { companyId } = req.params;
        const { newOwnerId } = req.body;

        if (!newOwnerId) {
            return res.status(400).json({ error: 'newOwnerId is required' });
        }

        // 1. Verify current user is the owner
        const { data: company, error: fetchError } = await db
            .from('company')
            .select('user_id, collaborator_ids, companyName')
            .eq('companyId', companyId)
            .single();

        if (fetchError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId) {
            return res.status(403).json({ error: 'Only the owner can transfer ownership' });
        }

        // 2. Verify new owner is a collaborator
        const collaboratorIds = company.collaborator_ids || [];
        if (!collaboratorIds.includes(newOwnerId)) {
            return res.status(400).json({ error: 'New owner must be an existing collaborator' });
        }

        // 3. Update company ownership
        const updatedCollaboratorIds = [
            ...collaboratorIds.filter(id => id !== newOwnerId), // Remove new owner from collaborators
            userId // Add old owner as collaborator
        ];

        const { data: updatedCompany, error: updateError } = await db
            .from('company')
            .update({
                user_id: newOwnerId,
                collaborator_ids: updatedCollaboratorIds
            })
            .eq('companyId', companyId)
            .select()
            .single();

        if (updateError) {
            console.error('Error transferring ownership:', updateError);
            return res.status(500).json({ error: 'Failed to transfer ownership' });
        }

        return res.json({
            success: true,
            company: updatedCompany,
            message: `Ownership of "${company.companyName}" transferred successfully`
        });

    } catch (error) {
        console.error('Transfer ownership error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
