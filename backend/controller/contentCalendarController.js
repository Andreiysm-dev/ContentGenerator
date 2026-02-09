import db from '../database/db.js';
import { generateImageForCalendarRow } from '../services/imageGenerationService.js';

// Helper to verify user has access to company
async function verifyCompanyAccess(userId, companyId) {
    const { data: company, error } = await db
        .from('company')
        .select('user_id, collaborator_ids')
        .eq('companyId', companyId)
        .single();
    if (error || !company) return { ok: false, status: 404 };
    if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
        return { ok: false, status: 403 };
    }
    return { ok: true };
}

// CREATE - Add a new content calendar entry
export const createContentCalendar = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { companyId, ...rest } = req.body;
        if (!companyId) return res.status(400).json({ error: 'companyId is required' });

        const access = await verifyCompanyAccess(userId, companyId);
        if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });

        const payload = { companyId, ...rest, user_id: userId };
        const { data: row, error } = await db
            .from('contentCalendar')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Error creating contentCalendar:', error);
            return res.status(500).json({ error: 'Failed to create content calendar', details: error.message });
        }
        return res.status(201).json({ contentCalendar: row });
    } catch (err) {
        console.error('createContentCalendar error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - Get all content calendars (for user's companies)
export const getAllContentCalendars = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { data: companies, error: companyError } = await db
            .from('company')
            .select('companyId')
            .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`);

        if (companyError) {
            console.error('Error fetching companies:', companyError);
            return res.status(500).json({ error: 'Failed to fetch content calendars' });
        }
        const companyIds = (companies || []).map((c) => c.companyId);
        if (companyIds.length === 0) return res.status(200).json({ contentCalendars: [], count: 0 });

        const { data: rows, error } = await db
            .from('contentCalendar')
            .select('*')
            .in('companyId', companyIds)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching contentCalendars:', error);
            return res.status(500).json({ error: 'Failed to fetch content calendars' });
        }
        return res.status(200).json({ contentCalendars: rows || [], count: (rows || []).length });
    } catch (err) {
        console.error('getAllContentCalendars error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - Get content calendar by ID
export const getContentCalendarById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { data: row, error } = await db
            .from('contentCalendar')
            .select('*')
            .eq('contentCalendarId', id)
            .single();

        if (error || !row) {
            return res.status(404).json({ error: 'Content calendar not found' });
        }

        const access = await verifyCompanyAccess(userId, row.companyId);
        if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });

        return res.status(200).json({ contentCalendar: row });
    } catch (err) {
        console.error('getContentCalendarById error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - Get content calendars by company ID
export const getContentCalendarsByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const access = await verifyCompanyAccess(userId, companyId);
        if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });

        const { data: rows, error } = await db
            .from('contentCalendar')
            .select('*')
            .eq('companyId', companyId)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching contentCalendars:', error);
            return res.status(500).json({ error: 'Failed to fetch content calendars' });
        }
        return res.status(200).json({ contentCalendars: rows || [], count: (rows || []).length });
    } catch (err) {
        console.error('getContentCalendarsByCompanyId error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - Get content calendars by date range
export const getContentCalendarsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate, companyId } = req.query;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });

        let companyIds = [];
        if (companyId) {
            const access = await verifyCompanyAccess(userId, companyId);
            if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });
            companyIds = [companyId];
        } else {
            const { data: companies } = await db
                .from('company')
                .select('companyId')
                .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`);
            companyIds = (companies || []).map((c) => c.companyId);
        }
        if (companyIds.length === 0) return res.status(200).json({ contentCalendars: [], count: 0 });

        const { data: rows, error } = await db
            .from('contentCalendar')
            .select('*')
            .in('companyId', companyIds)
            .gte('scheduled_at', startDate)
            .lte('scheduled_at', endDate)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching contentCalendars:', error);
            return res.status(500).json({ error: 'Failed to fetch content calendars' });
        }
        return res.status(200).json({ contentCalendars: rows || [], count: (rows || []).length });
    } catch (err) {
        console.error('getContentCalendarsByDateRange error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// READ - Get content calendars by status
export const getContentCalendarsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { companyId } = req.query;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        let companyIds = [];
        if (companyId) {
            const access = await verifyCompanyAccess(userId, companyId);
            if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });
            companyIds = [companyId];
        } else {
            const { data: companies } = await db
                .from('company')
                .select('companyId')
                .or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`);
            companyIds = (companies || []).map((c) => c.companyId);
        }
        if (companyIds.length === 0) return res.status(200).json({ contentCalendars: [], count: 0 });

        const { data: rows, error } = await db
            .from('contentCalendar')
            .select('*')
            .in('companyId', companyIds)
            .eq('status', status)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching contentCalendars:', error);
            return res.status(500).json({ error: 'Failed to fetch content calendars' });
        }
        return res.status(200).json({ contentCalendars: rows || [], count: (rows || []).length });
    } catch (err) {
        console.error('getContentCalendarsByStatus error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// UPDATE - Update content calendar by ID
export const updateContentCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { data: existing, error: fetchError } = await db
            .from('contentCalendar')
            .select('companyId')
            .eq('contentCalendarId', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ error: 'Content calendar not found' });

        const access = await verifyCompanyAccess(userId, existing.companyId);
        if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });

        const { contentCalendarId, companyId, created_at, ...updateData } = req.body;
        if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No fields to update' });

        const { data: row, error } = await db
            .from('contentCalendar')
            .update(updateData)
            .eq('contentCalendarId', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating contentCalendar:', error);
            return res.status(500).json({ error: 'Failed to update content calendar' });
        }
        return res.status(200).json({ contentCalendar: row });
    } catch (err) {
        console.error('updateContentCalendar error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE - Delete content calendar by ID
export const deleteContentCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { data: existing, error: fetchError } = await db
            .from('contentCalendar')
            .select('companyId')
            .eq('contentCalendarId', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ error: 'Content calendar not found' });

        const access = await verifyCompanyAccess(userId, existing.companyId);
        if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });

        const { data: row, error } = await db
            .from('contentCalendar')
            .delete()
            .eq('contentCalendarId', id)
            .select()
            .single();

        if (error) {
            console.error('Error deleting contentCalendar:', error);
            return res.status(500).json({ error: 'Failed to delete content calendar' });
        }
        return res.status(200).json({ message: 'Deleted', contentCalendar: row });
    } catch (err) {
        console.error('deleteContentCalendar error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE - Delete all content calendars for a company
export const deleteContentCalendarsByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const access = await verifyCompanyAccess(userId, companyId);
        if (!access.ok) return res.status(access.status).json({ error: 'Forbidden' });

        const { data: rows, error } = await db
            .from('contentCalendar')
            .delete()
            .eq('companyId', companyId)
            .select();

        if (error) {
            console.error('Error deleting contentCalendars:', error);
            return res.status(500).json({ error: 'Failed to delete content calendars' });
        }
        return res.status(200).json({ message: `Deleted ${(rows || []).length} entries`, count: (rows || []).length });
    } catch (err) {
        console.error('deleteContentCalendarsByCompanyId error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// POST - Trigger batch image generation for selected rows
export const batchGenerateImages = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { rowIds, brandKbId, systemInstruction } = req.body || {};
        if (!Array.isArray(rowIds) || rowIds.length === 0) {
            return res.status(400).json({ error: 'rowIds must be a non-empty array.' });
        }
        if (!brandKbId) {
            return res.status(400).json({ error: 'brandKbId is required.' });
        }

        const { data: rows, error } = await db
            .from('contentCalendar')
            .select('*')
            .in('contentCalendarId', rowIds);

        if (error) {
            console.error('Error fetching rows for image generation:', error);
            return res.status(500).json({ error: 'Failed to load rows for image generation.' });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No rows found for the provided IDs.' });
        }

        const companyIds = Array.from(new Set(rows.map((row) => row.companyId).filter(Boolean)));
        const { data: companies, error: companyError } = await db
            .from('company')
            .select('companyId, user_id, collaborator_ids')
            .in('companyId', companyIds);

        if (companyError) {
            console.error('Error fetching companies for image generation:', companyError);
            return res.status(500).json({ error: 'Failed to authorize image generation.' });
        }

        const allowedCompanyIds = new Set(
            (companies || [])
                .filter((company) => company.user_id === userId || company.collaborator_ids?.includes(userId))
                .map((company) => company.companyId),
        );
        const allowedRows = rows.filter((row) => allowedCompanyIds.has(row.companyId));

        if (allowedRows.length === 0) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        let successCount = 0;
        for (const row of allowedRows) {
            if (!row.companyId) continue;
            try {
                const result = await generateImageForCalendarRow(row.contentCalendarId, {
                    userId,
                    systemInstruction: systemInstruction ?? '',
                });

                if (result.ok) {
                    successCount += 1;
                } else {
                    console.error('Image generation failed:', row.contentCalendarId, result.status, result.error);
                }
            } catch (err) {
                console.error('Image generation error:', row.contentCalendarId, err);
            }
        }

        return res.status(200).json({
            message: 'Image generation triggered.',
            successCount,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};