import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET /api/collaborators/:companyId
export const getCollaboratorsByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is owner or collaborator
    const { data: company, error: companyError } = await db
      .from('company')
      .select('user_id')
      .eq('companyId', companyId)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { data: collab, error: collabError } = await db
      .from('company_collaborators')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();

    if (company.user_id !== userId && collabError) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch owner + collaborators
    const { data: owner, error: ownerError } = await db
      .from('auth.users')
      .select('id, email')
      .eq('id', company.user_id)
      .single();

    const { data: collaborators, error: collaboratorsError } = await db
      .from('company_collaborators')
      .select('user_id')
      .eq('company_id', companyId);

    const result = [];
    if (owner && !ownerError) {
      result.push({ id: owner.id, email: owner.email, role: 'owner' });
    }

    if (collaborators && !collaboratorsError) {
      const userIds = collaborators.map(c => c.user_id);
      const { data: users } = await db
        .from('auth.users')
        .select('id, email')
        .in('id', userIds);

      if (users) {
        users.forEach(u => result.push({ id: u.id, email: u.email, role: 'collaborator' }));
      }
    }

    return res.json({ collaborators: result });
  } catch (err) {
    console.error('getCollaboratorsByCompanyId error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/collaborators/:companyId
export const addCollaborator = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { email } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify user is owner
    const { data: company, error: companyError } = await db
      .from('company')
      .select('user_id')
      .eq('companyId', companyId)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.user_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can add collaborators' });
    }

    // Resolve email to uid
    const { data: targetUser, error: userError } = await db
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: 'User with this email not found or not registered' });
    }

    // Prevent duplicate
    const { data: existing, error: existingError } = await db
      .from('company_collaborators')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('user_id', targetUser.id)
      .single();

    if (!existingError) {
      return res.status(409).json({ error: 'User is already a collaborator' });
    }

    // Insert collaborator
    const { error: insertError } = await db
      .from('company_collaborators')
      .insert({ company_id: companyId, user_id: targetUser.id });

    if (insertError) {
      console.error('addCollaborator insert error', insertError);
      return res.status(500).json({ error: 'Failed to add collaborator' });
    }

    return res.json({ message: 'Collaborator added' });
  } catch (err) {
    console.error('addCollaborator error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/collaborators/:companyId/:userId
export const removeCollaborator = async (req, res) => {
  try {
    const { companyId, userId: targetUserId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is owner
    const { data: company, error: companyError } = await db
      .from('company')
      .select('user_id')
      .eq('companyId', companyId)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.user_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can remove collaborators' });
    }

    const { error: deleteError } = await db
      .from('company_collaborators')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('removeCollaborator delete error', deleteError);
      return res.status(500).json({ error: 'Failed to remove collaborator' });
    }

    return res.json({ message: 'Collaborator removed' });
  } catch (err) {
    console.error('removeCollaborator error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/collaborators/:companyId', getCollaboratorsByCompanyId);
router.post('/collaborators/:companyId', addCollaborator);
router.delete('/collaborators/:companyId/:userId', removeCollaborator);

export default router;
