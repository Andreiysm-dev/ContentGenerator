import db from '../database/db.js';

export const getCompanyAuditLogs = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

        const { data: logs, error } = await db
            .from('audit_logs')
            .select('*')
            .or(`and(entity_type.eq.company,entity_id.eq.${companyId}),details->>companyId.eq.${companyId}`)
            .order('created_at', { ascending: false })
            .limit(200);

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

        return res.status(200).json({ logs: mappedLogs });
    } catch (error) {
        console.error('Unexpected audit error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
