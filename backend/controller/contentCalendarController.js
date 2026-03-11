import db from '../database/db.js';
import { getTargetStatusFromAutomation } from '../services/kanbanAutomationService.js';
import { generateImageForCalendarRow } from '../services/imageGenerationService.js';
import { logAudit } from '../services/auditService.js';
import * as notificationService from '../services/notificationService.js';

// Helper to verify user has access to company and specific permissions
async function verifyCompanyAccess(userId, companyId, requiredPermission = null) {
    const { data: company, error } = await db
        .from('company')
        .select('user_id, collaborator_ids, custom_roles, collaborator_roles, kanban_settings')
        .eq('companyId', companyId)
        .single();

    if (error || !company) return { ok: false, status: 404 };

    // Owners have all permissions
    if (company.user_id === userId) return { ok: true, isOwner: true, role: 'owner', company };

    // Check if user is a collaborator
    if (!(company.collaborator_ids?.includes(userId))) {
        return { ok: false, status: 403, error: 'You do not have access to this company.' };
    }

    // Get user's role
    const userRoleName = company.collaborator_roles?.[userId];

    // If no specific permission is required, being a collaborator is enough
    if (!requiredPermission) return { ok: true, isOwner: false, role: userRoleName, company };

    if (!userRoleName) return { ok: true, isOwner: false, role: null, company }; // Default collaborator role

    // Find role definition
    const roleDef = company.custom_roles?.find(r => r.name === userRoleName);
    if (!roleDef) return { ok: true, isOwner: false, role: userRoleName, company }; // Role not found, fallback to basic access

    // Check if permission is explicitly granted
    if (roleDef.permissions && roleDef.permissions[requiredPermission] === true) {
        return { ok: true, isOwner: false, role: userRoleName, company };
    }

    // If role has permissions object but this one is missing or false
    if (roleDef.permissions && roleDef.permissions[requiredPermission] === false) {
        const readablePerm = requiredPermission.replace('can', '').toLowerCase();
        return { ok: false, status: 403, error: `Your role (${userRoleName}) lacks ${readablePerm} permissions.` };
    }

    return { ok: true, isOwner: false, role: userRoleName, company };
}

// CREATE - Add a new content calendar entry
export const createContentCalendar = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { companyId, ...rest } = req.body;
        if (!companyId) return res.status(400).json({ error: 'companyId is required' });

        const access = await verifyCompanyAccess(userId, companyId, 'canCreate');
        if (!access.ok) return res.status(access.status).json({ error: access.error || 'Forbidden' });

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

        // Automatic Queueing Logic: If status is set to Scheduled, move to scheduled_posts for the scheduler service
        if (row && (row.status === 'Scheduled' || row.status === 'SCHEDULED') && row.scheduled_at) {
            try {
                const postPayload = {
                    company_id: row.companyId,
                    content_calendar_id: row.contentCalendarId,
                    scheduled_at: row.scheduled_at,
                    status: 'PENDING',
                    content: row.finalCaption || row.captionOutput || '',
                    media_urls: (row.media_urls && row.media_urls.length > 0)
                        ? row.media_urls
                        : (row.imageGenerated ? [row.imageGenerated] : (row.imageGeneratedUrl ? [row.imageGeneratedUrl] : [])),
                    account_ids: row.channels || []
                };

                // On creation, we just insert
                await db
                    .from('scheduled_posts')
                    .insert([postPayload]);
            } catch (queueErr) {
                console.error('Failed to auto-queue post on creation:', queueErr);
            }
        }

        // Trigger notifications for watchers if status is set on creation
        if (row && row.status) {
            await notificationService.notifyWatchers({
                companyId: row.companyId,
                status: row.status,
                contentTheme: row.theme,
                triggeredByUserId: userId
            });
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
            .select('*')
            .eq('contentCalendarId', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ error: 'Content calendar not found' });

        // --- Mass Assignment Protection ---
        // Only allow an explicit list of user-updatable fields.
        // Sensitive fields (user_id, companyId, collaborator_ids, contentCalendarId, created_at)
        // are never accepted from the request body — they come from the DB or route params.
        const ALLOWED_UPDATE_FIELDS = [
            // Core content fields
            'status', 'theme', 'platform', 'contentType',
            'captionOutput', 'finalCaption', 'imageGenerated', 'imageGeneratedUrl',
            'media_urls', 'scheduled_at', 'channels',
            // Workflow & comments
            'supervisor_comments', 'reviewer_comments',
            'post_status',          // draft/ready toggle from DraftPublishModal
            'isApproved',
            // Design & assets
            'attachedDesign',       // design file URLs from handleUploadDesigns
            // Brand & campaign context
            'broadIdea', 'contentContext', 'brandKbId',
            // Creative metadata
            'dmp', 'card_name',
            // Scheduling & planning
            'content_deadline', 'design_deadline',
            // Collaboration
            'watchers', 'checklist', 'collaborators',
            // Display / UI
            'kanban_position', 'tags', 'content_notes', 'custom_fields',
            'title', 'notes', 'format', 'objective',
        ];
        const updateData = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }
        // Preserve internal provider/model metadata if explicitly passed (used by AI generation)
        // but these are used for display only, not security-sensitive
        if (req.body.provider !== undefined) updateData.provider = req.body.provider;
        if (req.body.model !== undefined) updateData.model = req.body.model;

        // Safely extract status string (can be either a plain string or { state, updatedAt, by } object)
        const statusStr = updateData.status
            ? (typeof updateData.status === 'object' ? (updateData.status.state || '') : String(updateData.status))
            : '';
        const requiredPerm = 'canCreate';

        const access = await verifyCompanyAccess(userId, existing.companyId, requiredPerm);
        if (!access.ok) return res.status(access.status).json({ error: access.error || 'Forbidden' });

        // Enforcement of Access Rules / Locking
        const kanbanSettings = access.company?.kanban_settings;
        if (kanbanSettings?.automations) {
            const currentStatus = (typeof existing.status === 'object' ? existing.status.state : existing.status) || '';
            const lockRule = kanbanSettings.automations.find(a => a.type === 'access_rule' && a.columnId === currentStatus);
            if (lockRule) {
                if (!access.isOwner && access.role !== lockRule.roleName) {
                    return res.status(403).json({ error: `This content is locked to the ${lockRule.roleName} role. Dragging or editing is restricted.` });
                }
            }
        }

        // Kanban Automation Triggering Logic
        // Only auto-move if the user hasn't explicitly set a different status in this same request
        // AND the current status is an intermediate/working state
        const isUserExplicitlySettingStatus = !!updateData.status;
        const intermediateStatuses = ['Draft', 'Drafts', 'Generating', 'To Do', 'Planning'];
        const currentStatusStr = existing.status && typeof existing.status === 'object'
            ? (existing.status.state || '')
            : (existing.status || '');
        const isCurrentlyIntermediate = intermediateStatuses.some(s =>
            s.toLowerCase() === currentStatusStr.toLowerCase()
        );

        // Run automation logic
        try {
            let targetStatus = null;

            // 1. Event-based triggers (when data changes)
            if (!isUserExplicitlySettingStatus) {
                if (updateData.captionOutput && !existing.captionOutput) {
                    targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'caption_generated', null);
                }
                if (!targetStatus && updateData.imageGenerated && !existing.imageGenerated) {
                    targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'image_generated', null);
                }
                if (!targetStatus && updateData.supervisor_comments && !existing.supervisor_comments) {
                    targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'comment_added', null);
                }
            }

            // 2. Lifecycle triggers (Scheduled / Unscheduled / Posted)
            // Scheduled: date added
            if (!targetStatus && updateData.scheduled_at && !existing.scheduled_at) {
                targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'content_scheduled', null);
            }
            // Unscheduled: date removed
            if (!targetStatus && updateData.scheduled_at === null && existing.scheduled_at) {
                targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'content_unscheduled', null);
            }
            // Posted: status becoming published
            if (!targetStatus && (statusStr.toUpperCase() === 'PUBLISHED') && currentStatusStr.toUpperCase() !== 'PUBLISHED') {
                targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'content_posted', null);
            }

            // 3. User-Action triggers (Manual status moves)
            if (!targetStatus && isUserExplicitlySettingStatus) {
                if (updateData.supervisor_comments && !existing.supervisor_comments) {
                    targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'comment_added', null);
                }
                if (!targetStatus && (statusStr === 'Revision' || statusStr === 'REVISION')) {
                    targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'revision_requested', null);
                }
                // Handle Content Approved event mapping
                if (!targetStatus && (statusStr === 'Approved' || statusStr === 'APPROVED' || statusStr === 'Ready' || statusStr === 'READY')) {
                    targetStatus = await getTargetStatusFromAutomation(existing.companyId, 'content_approved', null);
                }
            }

            if (targetStatus) {
                updateData.status = targetStatus;
            }
        } catch (err) {
            console.error('Failed to process kanban automations:', err);
        }

        // Clear supervisor comments on approval/publish
        if (statusStr && (statusStr.toUpperCase() === 'SCHEDULED' || statusStr.toUpperCase() === 'PUBLISHED')) {
            updateData.supervisor_comments = null;
        }

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

        // Automatic Queueing Logic: If status is set to Scheduled, move to scheduled_posts for the scheduler service
        if (row && (row.status === 'Scheduled' || row.status === 'SCHEDULED') && row.scheduled_at) {
            try {
                const { data: existingPost } = await db
                    .from('scheduled_posts')
                    .select('id')
                    .eq('content_calendar_id', id)
                    .maybeSingle();

                const postPayload = {
                    company_id: row.companyId,
                    content_calendar_id: row.contentCalendarId,
                    scheduled_at: row.scheduled_at,
                    status: 'PENDING',
                    content: row.finalCaption || row.captionOutput || '',
                    media_urls: (row.media_urls && row.media_urls.length > 0)
                        ? row.media_urls
                        : (row.imageGenerated ? [row.imageGenerated] : (row.imageGeneratedUrl ? [row.imageGeneratedUrl] : [])),
                    account_ids: row.channels || []
                };

                if (existingPost) {
                    // Update existing queue entry
                    await db
                        .from('scheduled_posts')
                        .update({ ...postPayload, updated_at: new Date().toISOString() })
                        .eq('id', existingPost.id);
                } else {
                    // Insert new queue entry
                    await db
                        .from('scheduled_posts')
                        .insert([postPayload]);
                }
            } catch (queueErr) {
                console.error('Failed to auto-queue post:', queueErr);
                // We don't fail the main request, but log the error
            }
        }

        if (updateData.status && updateData.status !== existing.status) {
            await logAudit(userId, 'STATUS_CHANGE', 'contentCalendar', id, {
                oldStatus: existing.status,
                newStatus: updateData.status,
                companyId: existing.companyId
            });

            // Notification for Locked Columns (Approvals)
            await notificationService.checkAndNotifyApproval({
                companyId: existing.companyId,
                status: updateData.status,
                contentTheme: row.theme,
                userId: userId
            });

            // Generic Watcher Notifications
            await notificationService.notifyWatchers({
                companyId: existing.companyId,
                status: updateData.status,
                contentTheme: row.theme,
                triggeredByUserId: userId
            });
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
            .select('companyId, imageGenerated')
            .eq('contentCalendarId', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ error: 'Content calendar not found' });

        const access = await verifyCompanyAccess(userId, existing.companyId, 'canDelete');
        if (!access.ok) return res.status(access.status).json({ error: access.error || 'Forbidden' });

        // Storage Cleanup: Remove image from bucket if it exists
        if (existing.imageGenerated) {
            try {
                // imageGenerated usually stores the path like "companyId/contentId/filename.png"
                await db.storage
                    .from('generated-images')
                    .remove([existing.imageGenerated]);
            } catch (storageErr) {
                console.error('Failed to cleanup storage for deleted contentCalendar:', storageErr);
                // We continue with the DB deletion even if storage cleanup fails
            }
        }

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
        await logAudit(userId, 'CONTENT_DELETE', 'contentCalendar', id, {
            companyId: existing.companyId
        });

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

        const access = await verifyCompanyAccess(userId, companyId, 'canDelete');
        if (!access.ok) return res.status(access.status).json({ error: access.error || 'Forbidden' });

        // Delete from DB and get back all the paths to delete from storage
        const { data: rows, error } = await db
            .from('contentCalendar')
            .delete()
            .eq('companyId', companyId)
            .select('imageGenerated');

        if (error) {
            console.error('Error deleting contentCalendars:', error);
            return res.status(500).json({ error: 'Failed to delete content calendars' });
        }

        // Storage Cleanup: Remove all images linked to these rows
        const filePaths = (rows || [])
            .map(r => r.imageGenerated)
            .filter(Boolean);

        if (filePaths.length > 0) {
            try {
                await db.storage
                    .from('generated-images')
                    .remove(filePaths);
            } catch (storageErr) {
                console.error('Failed to cleanup batch storage for company:', companyId, storageErr);
            }
        }

        await logAudit(userId, 'CONTENT_BULK_DELETE', 'company', companyId, {
            count: (rows || []).length
        });

        return res.status(200).json({ message: `Deleted ${(rows || []).length} entries and cleaned up storage`, count: (rows || []).length });
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

        const { rowIds, brandKbId, systemInstruction, provider, model, aspectRatio } = req.body;

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

        const allowedCompanyIds = new Set();
        for (const company of companies || []) {
            const hasAccess = company.user_id === userId || (company.collaborator_ids?.includes(userId));
            if (!hasAccess) continue;

            const access = await verifyCompanyAccess(userId, company.companyId, 'canGenerate');
            if (access.ok) {
                allowedCompanyIds.add(company.companyId);
            }
        }
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
                    provider,
                    model,
                    aspectRatio,
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