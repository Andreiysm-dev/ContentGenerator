import db from '../database/db.js';

async function verifyCommentAccess(userId, contentCalendarId) {
    const { data: contentRow, error: contentError } = await db
        .from('contentCalendar')
        .select('companyId')
        .eq('contentCalendarId', contentCalendarId)
        .single();

    if (contentError || !contentRow?.companyId) {
        return { ok: false, status: 404, error: 'Content calendar not found' };
    }

    const { data: company, error: companyError } = await db
        .from('company')
        .select('user_id, collaborator_ids')
        .eq('companyId', contentRow.companyId)
        .single();

    if (companyError || !company) {
        return { ok: false, status: 404, error: 'Company not found' };
    }

    const hasAccess = company.user_id === userId || (company.collaborator_ids || []).includes(userId);
    if (!hasAccess) {
        return { ok: false, status: 403, error: 'Forbidden' };
    }

    return { ok: true, companyId: contentRow.companyId };
}

export const getContentComments = async (req, res) => {
    try {
        const { contentCalendarId } = req.params;
        const { page = 1, pageSize = 5 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(pageSize);
        const offset = (pageNum - 1) * limitNum;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const access = await verifyCommentAccess(userId, contentCalendarId);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }

        const { data: comments, count, error } = await db
            .from('content_comments')
            .select('*', { count: 'exact' })
            .eq('content_calendar_id', contentCalendarId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            console.error('Error fetching comments:', error);
            return res.status(500).json({ error: 'Failed to fetch comments' });
        }

        // Fetch auth users to map emails
        const { data: authData } = await db.auth.admin.listUsers();
        const authUsers = authData?.users || [];

        const mappedComments = comments.map(comment => {
            const user = authUsers.find(u => u.id === comment.user_id);
            return {
                ...comment,
                actorEmail: user ? user.email : 'Unknown',
                actorName: user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Unknown'
            };
        });

        return res.status(200).json({
            comments: mappedComments,
            count,
            page: pageNum,
            pageSize: limitNum
        });
    } catch (error) {
        console.error('getContentComments error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const createContentComment = async (req, res) => {
    try {
        const { contentCalendarId } = req.params;
        const { text } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!text) return res.status(400).json({ error: 'Comment text is required' });

        const access = await verifyCommentAccess(userId, contentCalendarId);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }

        const { data: comment, error } = await db
            .from('content_comments')
            .insert({
                content_calendar_id: contentCalendarId,
                user_id: userId,
                text
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return res.status(500).json({ error: 'Failed to create comment' });
        }

        return res.status(201).json({ comment });
    } catch (error) {
        console.error('createContentComment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteContentComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { data: existing } = await db
            .from('content_comments')
            .select('user_id, content_calendar_id')
            .eq('id', commentId)
            .single();

        if (!existing) return res.status(404).json({ error: 'Comment not found' });

        const access = await verifyCommentAccess(userId, existing.content_calendar_id);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }

        if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

        const { error } = await db
            .from('content_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error('Error deleting comment:', error);
            return res.status(500).json({ error: 'Failed to delete comment' });
        }

        return res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('deleteContentComment error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
