import db from '../database/db.js';

const IMAGE_WEBHOOK_URL =
    process.env.MAKE_IMAGE_EXISTING_DMP_WEBHOOK ||
    'https://hook.eu2.make.com/ms8ivolxdradx79w0nh6x96yuejq0o6a';

// CREATE - Add a new content calendar entry
export const createContentCalendar = async (req, res) => {
    try {
        const { 
            date,
            brandHighlight,
            crossPromo,
            theme,
            contentType,
            channels,
            targetAudience,
            primaryGoal,
            cta,
            promoType,
            status,
            post_status,
            scheduled_at,
            draft_caption,
            draft_image_url,
            publish_result,
            captionOutput,
            ctaOuput,
            hastagsOutput,
            frameworkUsed,
            reviewDecision,
            reviewNotes,
            finalCaption,
            finalCTA,
            finalHashtags,
            dmp,
            attachedDesign,
            imageGenerated,
            companyId 
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

        const { data: contentCalendar, error: contentCalendarError } = await db
            .from('contentCalendar')
            .insert([
                { 
                    date,
                    brandHighlight,
                    crossPromo,
                    theme,
                    contentType,
                    channels,
                    targetAudience,
                    primaryGoal,
                    cta,
                    promoType,
                    status,
                    post_status,
                    scheduled_at,
                    draft_caption,
                    draft_image_url,
                    publish_result,
                    captionOutput,
                    ctaOuput,
                    hastagsOutput,
                    frameworkUsed,
                    reviewDecision,
                    reviewNotes,
                    finalCaption,
                    finalCTA,
                    finalHashtags,
                    dmp,
                    attachedDesign,
                    imageGenerated,
                    companyId,
                    user_id: userId,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (contentCalendarError) {
            console.error('Error creating content calendar:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to create content calendar entry',
                details: contentCalendarError.message 
            });
        }

        return res.status(201).json({ 
            message: 'Content calendar entry created successfully',
            contentCalendar: contentCalendar[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get all content calendar entries
export const getAllContentCalendars = async (req, res) => {
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
                error: 'Failed to fetch content calendar entries',
                details: companyError.message,
            });
        }

        const companyIds = (companies || []).map((company) => company.companyId);
        if (companyIds.length === 0) {
            return res.status(200).json({ contentCalendars: [], count: 0 });
        }

        const { data: contentCalendars, error: contentCalendarError } = await db
            .from('contentCalendar')
            .select('*')
            .in('companyId', companyIds)
            .order('date', { ascending: false });

        if (contentCalendarError) {
            console.error('Error fetching content calendars:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to fetch content calendar entries',
                details: contentCalendarError.message 
            });
        }

        return res.status(200).json({ 
            contentCalendars,
            count: contentCalendars.length 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get content calendar entries by company ID
export const getContentCalendarsByCompanyId = async (req, res) => {
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

        const { data: contentCalendars, error: contentCalendarError } = await db
            .from('contentCalendar')
            .select('*')
            .eq('companyId', companyId)
            .order('created_at', { ascending: true });

        if (contentCalendarError) {
            console.error('Error fetching content calendars:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to fetch content calendar entries',
                details: contentCalendarError.message 
            });
        }

        return res.status(200).json({ 
            contentCalendars,
            count: contentCalendars.length 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get a single content calendar entry by ID
export const getContentCalendarById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: contentCalendar, error: contentCalendarError } = await db
            .from('contentCalendar')
            .select('*')
            .eq('contentCalendarId', id)
            .single();

        if (contentCalendarError) {
            if (contentCalendarError.code === 'PGRST116') {
                return res.status(404).json({ 
                    error: 'Content calendar entry not found' 
                });
            }
            console.error('Error fetching content calendar:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to fetch content calendar entry',
                details: contentCalendarError.message 
            });
        }

        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id, collaborator_ids')
            .eq('companyId', contentCalendar.companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId && !(company.collaborator_ids?.includes(userId))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        return res.status(200).json({ contentCalendar });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
} 

export const getContentCalendarsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate, companyId } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Start date and end date are required' 
            });
        }

        if (companyId) {
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
        }

        let query = db
            .from('contentCalendar')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        // Optional: filter by company
        if (companyId) {
            query = query.eq('companyId', companyId);
        } else {
            query = query.or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`);
        }

        const { data: contentCalendars, error: contentCalendarError } = await query;

        if (contentCalendarError) {
            console.error('Error fetching content calendars:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to fetch content calendar entries',
                details: contentCalendarError.message 
            });
        }

        return res.status(200).json({ 
            contentCalendars,
            count: contentCalendars.length,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// READ - Get content calendar entries by status
export const getContentCalendarsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { companyId } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (companyId) {
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
        }

        let query = db
            .from('contentCalendar')
            .select('*')
            .eq('status', status)
            .order('date', { ascending: false });

        // Optional: filter by company
        if (companyId) {
            query = query.eq('companyId', companyId);
        } else {
            query = query.or(`user_id.eq.${userId},collaborator_ids.cs.{${userId}}`);
        }

        const { data: contentCalendars, error: contentCalendarError } = await query;

        if (contentCalendarError) {
            console.error('Error fetching content calendars:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to fetch content calendar entries',
                details: contentCalendarError.message 
            });
        }

        return res.status(200).json({ 
            contentCalendars,
            count: contentCalendars.length,
            status
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// UPDATE - Update a content calendar entry by ID (partial update supported)
export const updateContentCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: existingRow, error: existingError } = await db
            .from('contentCalendar')
            .select('companyId')
            .eq('contentCalendarId', id)
            .single();

        if (existingError || !existingRow) {
            return res.status(404).json({ error: 'Content calendar entry not found' });
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
            date,
            brandHighlight,
            crossPromo,
            theme,
            contentType,
            channels,
            targetAudience,
            primaryGoal,
            cta,
            promoType,
            status,
            post_status,
            scheduled_at,
            draft_caption,
            draft_image_url,
            publish_result,
            captionOutput,
            ctaOuput,
            hastagsOutput,
            frameworkUsed,
            reviewDecision,
            reviewNotes,
            finalCaption,
            finalCTA,
            finalHashtags,
            dmp,
            attachedDesign,
            imageGenerated,
            companyId 
        } = req.body;

        // Build update object with only provided fields
        // Fields not included in the request body will remain unchanged in the database
        const updateData = {};
        if (date !== undefined) updateData.date = date;
        if (brandHighlight !== undefined) updateData.brandHighlight = brandHighlight;
        if (crossPromo !== undefined) updateData.crossPromo = crossPromo;
        if (theme !== undefined) updateData.theme = theme;
        if (contentType !== undefined) updateData.contentType = contentType;
        if (channels !== undefined) updateData.channels = channels;
        if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
        if (primaryGoal !== undefined) updateData.primaryGoal = primaryGoal;
        if (cta !== undefined) updateData.cta = cta;
        if (promoType !== undefined) updateData.promoType = promoType;
        if (status !== undefined) updateData.status = status;
        if (post_status !== undefined) updateData.post_status = post_status;
        if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
        if (draft_caption !== undefined) updateData.draft_caption = draft_caption;
        if (draft_image_url !== undefined) updateData.draft_image_url = draft_image_url;
        if (publish_result !== undefined) updateData.publish_result = publish_result;
        if (captionOutput !== undefined) updateData.captionOutput = captionOutput;
        if (ctaOuput !== undefined) updateData.ctaOuput = ctaOuput;
        if (hastagsOutput !== undefined) updateData.hastagsOutput = hastagsOutput;
        if (frameworkUsed !== undefined) updateData.frameworkUsed = frameworkUsed;
        if (reviewDecision !== undefined) updateData.reviewDecision = reviewDecision;
        if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;
        if (finalCaption !== undefined) updateData.finalCaption = finalCaption;
        if (finalCTA !== undefined) updateData.finalCTA = finalCTA;
        if (finalHashtags !== undefined) updateData.finalHashtags = finalHashtags;
        if (dmp !== undefined) updateData.dmp = dmp;
        if (attachedDesign !== undefined) updateData.attachedDesign = attachedDesign;
        if (imageGenerated !== undefined) updateData.imageGenerated = imageGenerated;
        if (companyId !== undefined) updateData.companyId = companyId;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No fields to update. Please provide at least one field to update.' 
            });
        }

        const { data: contentCalendar, error: contentCalendarError } = await db
            .from('contentCalendar')
            .update(updateData)
            .eq('contentCalendarId', id)
            .select();

        if (contentCalendarError) {
            console.error('Error updating content calendar:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to update content calendar entry',
                details: contentCalendarError.message 
            });
        }

        if (!contentCalendar || contentCalendar.length === 0) {
            return res.status(404).json({ 
                error: 'Content calendar entry not found' 
            });
        }

        return res.status(200).json({ 
            message: 'Content calendar entry updated successfully',
            contentCalendar: contentCalendar[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// DELETE - Delete a content calendar entry by ID
export const deleteContentCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: existingRow, error: existingError } = await db
            .from('contentCalendar')
            .select('companyId')
            .eq('contentCalendarId', id)
            .single();

        if (existingError || !existingRow) {
            return res.status(404).json({ error: 'Content calendar entry not found' });
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

        const { data: contentCalendar, error: contentCalendarError } = await db
            .from('contentCalendar')
            .delete()
            .eq('contentCalendarId', id)
            .select();

        if (contentCalendarError) {
            console.error('Error deleting content calendar:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to delete content calendar entry',
                details: contentCalendarError.message 
            });
        }

        if (!contentCalendar || contentCalendar.length === 0) {
            return res.status(404).json({ 
                error: 'Content calendar entry not found' 
            });
        }

        return res.status(200).json({ 
            message: 'Content calendar entry deleted successfully',
            contentCalendar: contentCalendar[0] 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// DELETE - Delete all content calendar entries for a company
export const deleteContentCalendarsByCompanyId = async (req, res) => {
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

        const { data: contentCalendars, error: contentCalendarError } = await db
            .from('contentCalendar')
            .delete()
            .eq('companyId', companyId)
            .select();

        if (contentCalendarError) {
            console.error('Error deleting content calendars:', contentCalendarError);
            return res.status(500).json({ 
                error: 'Failed to delete content calendar entries',
                details: contentCalendarError.message 
            });
        }

        return res.status(200).json({ 
            message: `Deleted ${contentCalendars.length} content calendar entries`,
            count: contentCalendars.length,
            contentCalendars 
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            error: 'Internal server error' 
        });
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
                const response = await fetch(IMAGE_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentCalendarId: row.contentCalendarId,
                        companyId: row.companyId,
                        brandKbId,
                        systemInstruction: systemInstruction ?? '',
                        finalPrompt: row.captionOutput ?? '',
                        finalCaption: row.finalCaption ?? '',
                        brandHighlight: row.brandHighlight ?? '',
                        crossPromo: row.crossPromo ?? '',
                        theme: row.theme ?? '',
                        cta: row.cta ?? '',
                        targetAudience: row.targetAudience ?? '',
                    }),
                });

                if (response.ok) {
                    successCount += 1;
                } else {
                    const text = await response.text().catch(() => '');
                    console.error('Image webhook failed:', row.contentCalendarId, response.status, text);
                }
            } catch (err) {
                console.error('Image webhook error:', row.contentCalendarId, err);
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