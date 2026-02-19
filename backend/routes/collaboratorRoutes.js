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

    // Verify user is owner or collaborator via company.collaborator_ids
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

    // Fetch collaborators from company.collaborator_ids and resolve emails via admin API
    const { data: companyRow, error: fetchError } = await db
      .from('company')
      .select('user_id, collaborator_ids')
      .eq('companyId', companyId)
      .single();

    if (fetchError || !companyRow) {
      return res.status(500).json({ error: 'Failed to fetch company' });
    }

    const { data: { users }, error: adminError } = await db.auth.admin.listUsers();
    if (adminError) {
      return res.status(500).json({ error: 'Failed to query users' });
    }

    const result = [];
    // Owner
    const owner = users.find(u => u.id === companyRow.user_id);
    if (owner) {
      result.push({ id: owner.id, email: owner.email, role: 'owner' });
    }
    // Collaborators
    if (companyRow.collaborator_ids?.length) {
      companyRow.collaborator_ids.forEach(cid => {
        const u = users.find(user => user.id === cid);
        if (u) result.push({ id: u.id, email: u.email, role: 'collaborator' });
      });
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

    // Resolve email to uid using Supabase admin API
    console.log('addCollaborator: looking up email', email);
    const { data: { users }, error: adminError } = await db.auth.admin.listUsers();
    if (adminError) {
      console.error('admin.listUsers error', adminError);
      return res.status(500).json({ error: 'Failed to query users' });
    }
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    console.log('addCollaborator: targetUser', targetUser);
    if (!targetUser) {
      return res.status(404).json({ error: 'User with this email not found or not registered' });
    }

    // Prevent duplicate: check if already in collaborator_ids
    const { data: companyRow, error: fetchError } = await db
      .from('company')
      .select('collaborator_ids')
      .eq('companyId', companyId)
      .single();

    if (fetchError || !companyRow) {
      return res.status(500).json({ error: 'Failed to fetch company' });
    }

    const currentIds = companyRow.collaborator_ids || [];
    if (currentIds.includes(targetUser.id)) {
      return res.status(409).json({ error: 'User is already a collaborator' });
    }

    // Insert collaborator by adding to company.collaborator_ids array
    const nextIds = [...currentIds, targetUser.id];
    const { error: updateError } = await db
      .from('company')
      .update({
        collaborator_ids: nextIds
      })
      .eq('companyId', companyId);

    if (updateError) {
      console.error('addCollaborator update error', updateError);
      return res.status(500).json({ error: 'Failed to add collaborator' });
    }

    const { error: brandUpdateError } = await db
      .from('brandKB')
      .update({ collaborator_ids: nextIds })
      .eq('companyId', companyId);

    if (brandUpdateError) {
      console.error('addCollaborator brandKB update error', brandUpdateError);
      return res.status(500).json({ error: 'Failed to update brand settings collaborators' });
    }

    const { error: calendarUpdateError } = await db
      .from('contentCalendar')
      .update({ collaborator_ids: nextIds })
      .eq('companyId', companyId);

    if (calendarUpdateError) {
      console.error('addCollaborator calendar update error', calendarUpdateError);
      return res.status(500).json({ error: 'Failed to update content collaborators' });
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

    // Remove collaborator by removing from company.collaborator_ids array
    const { data: companyRow, error: fetchError } = await db
      .from('company')
      .select('collaborator_ids')
      .eq('companyId', companyId)
      .single();

    if (fetchError || !companyRow) {
      return res.status(500).json({ error: 'Failed to fetch company' });
    }

    const currentIds = companyRow.collaborator_ids || [];
    const nextIds = currentIds.filter((id) => id !== targetUserId);
    const { error: updateError } = await db
      .from('company')
      .update({
        collaborator_ids: nextIds
      })
      .eq('companyId', companyId);

    if (updateError) {
      console.error('removeCollaborator update error', updateError);
      return res.status(500).json({ error: 'Failed to remove collaborator' });
    }

    const { error: brandUpdateError } = await db
      .from('brandKB')
      .update({ collaborator_ids: nextIds })
      .eq('companyId', companyId);

    if (brandUpdateError) {
      console.error('removeCollaborator brandKB update error', brandUpdateError);
      return res.status(500).json({ error: 'Failed to update brand settings collaborators' });
    }

    const { error: calendarUpdateError } = await db
      .from('contentCalendar')
      .update({ collaborator_ids: nextIds })
      .eq('companyId', companyId);

    if (calendarUpdateError) {
      console.error('removeCollaborator calendar update error', calendarUpdateError);
      return res.status(500).json({ error: 'Failed to update content collaborators' });
    }

    return res.json({ message: 'Collaborator removed' });
  } catch (err) {
    console.error('removeCollaborator error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/search?email=...
export const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || email.length < 2) {
      return res.json({ users: [] });
    }

    const { data: { users }, error: adminError } = await db.auth.admin.listUsers();
    if (adminError) {
      return res.status(500).json({ error: 'Failed to query users' });
    }

    // Filter users by email (prefix match or contains)
    const filteredUsers = users
      .filter(u => u.email.toLowerCase().includes(email.toLowerCase()))
      .map(u => ({ id: u.id, email: u.email }))
      .slice(0, 5); // Limit to top 5 results

    return res.json({ users: filteredUsers });
  } catch (err) {
    console.error('searchUsers error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/collaborators/:companyId', getCollaboratorsByCompanyId);
router.get('/users/search', searchUsers);
router.post('/collaborators/:companyId', addCollaborator);
router.delete('/collaborators/:companyId/:userId', removeCollaborator);

export default router;
