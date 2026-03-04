import db from '../database/db.js';

export const getCompanyAuditLogs = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { entityId, page = 1, pageSize = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(pageSize);
        const offset = (pageNum - 1) * limitNum;

        // Verify the user is the owner
        const { data: company, error: companyError } = await db
            .from('company')
            .select('user_id')
            .eq('companyId', companyId)
            .single();

        if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden. Only the owner can view audit logs.' });
        }

        let query = db
            .from('audit_logs')
            .select('*', { count: 'exact' });

        if (entityId) {
            query = query.eq('entity_id', entityId);
        } else {
            query = query.or(`and(entity_type.eq.company,entity_id.eq.${companyId}),metadata->>companyId.eq.${companyId}`);
        }

        const { data: logs, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) {
            console.error('Error fetching audit logs:', error);
            return res.status(500).json({ error: 'Failed to fetch audit logs' });
        }

        // Map userId to email to show Actor Email
        const { data: authData } = await db.auth.admin.listUsers();
        const authUsers = authData?.users || [];

        const mappedLogs = logs.map(log => {
            const actor = authUsers.find(u => u.id === log.user_id);
            return {
                ...log,
                actorEmail: actor ? actor.email : 'Unknown'
            };
        });

        return res.status(200).json({
            logs: mappedLogs,
            count,
            page: pageNum,
            pageSize: limitNum
        });
    } catch (error) {
        console.error('Unexpected audit error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
