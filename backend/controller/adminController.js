import db from '../database/db.js';
import { logAudit } from '../services/auditService.js';

export const getAdminStats = async (req, res) => {
    try {
        // 1. Total Users
        const { count: userCount, error: userError } = await db
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 2. Total Companies
        const { count: companyCount, error: companyError } = await db
            .from('company')
            .select('*', { count: 'exact', head: true });

        // 3. Total Content Items
        const { count: contentCount, error: contentError } = await db
            .from('contentCalendar')
            .select('*', { count: 'exact', head: true });

        // 4. Images Generated (rows with imageGenerated not null)
        const { count: imageCount, error: imageError } = await db
            .from('contentCalendar')
            .select('*', { count: 'exact', head: true })
            .not('imageGenerated', 'is', null);

        // Total Spend
        let totalSpend = 0;
        let usageErr = null;
        try {
            const { data: usageData, error: usageError } = await db
                .from('api_usage_logs')
                .select('estimated_cost');

            if (usageError) {
                if (usageError.code === 'PGRST205') {
                    console.warn('[AdminStats] api_usage_logs table missing, defaulting spend to 0');
                } else {
                    usageErr = usageError;
                }
            } else {
                totalSpend = usageData?.reduce((acc, curr) => acc + (Number(curr.estimated_cost) || 0), 0) || 0;
            }
        } catch (e) {
            console.error('[AdminStats] unexpected error fetching usage:', e);
        }

        // 6. Recent Content Items (last 10)
        const { data: recentContent, error: recentError } = await db
            .from('contentCalendar')
            .select(`
                contentCalendarId,
                status,
                created_at,
                company:company!contentCalendar_companyId_fkey (companyName)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (userError || companyError || contentError || imageError || recentError || usageErr) {
            console.error('Error fetching admin stats:', { userError, companyError, contentError, imageError, recentError, usageError: usageErr });
            return res.status(500).json({ error: 'Failed to fetch admin statistics' });
        }

        return res.status(200).json({
            stats: {
                totalUsers: userCount || 0,
                totalCompanies: companyCount || 0,
                totalContent: contentCount || 0,
                totalImages: imageCount || 0,
                totalSpend: totalSpend
            },
            recentActivities: recentContent || []
        });
    } catch (error) {
        console.error('Unexpected admin controller error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { data: users, error } = await db
            .from('profiles')
            .select(`
                id,
                role,
                onboarding_completed,
                created_at
            `)
            .order('created_at', { ascending: false });

        // Fetch auth users to get email/metadata using the service role client
        const { data: authData, error: authError } = await db.auth.admin.listUsers();

        const authUsers = authData?.users || [];

        const enrichedUsers = users.map(u => {
            const authUser = authUsers.find(au => au.id === u.id);
            return {
                ...u,
                email: authUser?.email || 'N/A',
                full_name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.display_name || 'Anonymous User'
            };
        });

        return res.status(200).json({ users: enrichedUsers });
    } catch (error) {
        console.error('Unexpected admin controller error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ error: 'User ID and role are required' });
        }

        const { data, error } = await db
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user role:', error);
            return res.status(500).json({ error: 'Failed to update user role' });
        }

        await logAudit(req.user.id, 'USER_ROLE_UPDATE', 'profile', userId, { new_role: role });

        return res.status(200).json({ message: 'User role updated successfully', user: data });
    } catch (error) {
        console.error('Unexpected admin controller error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetOnboardingStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const { data, error } = await db
            .from('profiles')
            .update({ onboarding_completed: false })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error resetting onboarding status:', error);
            return res.status(500).json({ error: 'Failed to reset onboarding status' });
        }

        await logAudit(req.user.id, 'USER_ONBOARDING_RESET', 'profile', userId);

        return res.status(200).json({ message: 'Onboarding status reset successfully', user: data });
    } catch (error) {
        console.error('Unexpected admin controller error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        const { data: companies, error } = await db
            .from('company')
            .select(`
                companyId,
                companyName,
                created_at,
                user_id,
                contentCalendar!contentCalendar_companyId_fkey (count),
                brandKB:brandKB!brandKB_companyId_fkey (form_answer)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching companies:', error);
            return res.status(500).json({ error: 'Failed to fetch companies' });
        }

        // Fetch auth users to get owner emails/names
        const { data: authData } = await db.auth.admin.listUsers();
        const authUsers = authData?.users || [];

        // Map data to expected frontend format
        const formattedCompanies = await Promise.all(companies.map(async (c) => {
            const industry = c.brandKB?.[0]?.form_answer?.brandBasics?.industry || 'General';

            const authUser = authUsers.find(au => au.id === c.user_id);
            const ownerEmail = authUser?.email || 'N/A';
            const ownerName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.display_name || 'Unknown';

            // Get content count
            const { count: totalContent } = await db
                .from('contentCalendar')
                .select('*', { count: 'exact', head: true })
                .eq('companyId', c.companyId);

            // Get image count
            const { count: totalImages } = await db
                .from('contentCalendar')
                .select('*', { count: 'exact', head: true })
                .eq('companyId', c.companyId)
                .not('imageGenerated', 'is', null);

            // Get estimated spend
            let totalSpend = 0;
            try {
                const { data: companyUsage, error: usageErr } = await db
                    .from('api_usage_logs')
                    .select('estimated_cost')
                    .eq('company_id', c.companyId);

                if (!usageErr) {
                    totalSpend = companyUsage?.reduce((acc, curr) => acc + (Number(curr.estimated_cost) || 0), 0) || 0;
                }
            } catch (e) {
                // Ignore usage error here to keep company list working
            }

            // Calculate estimated credits
            // 1 Post = 1 Credit, 1 Image = 5 Credits
            const estimatedCredits = (totalContent || 0) + ((totalImages || 0) * 5);

            return {
                companyId: c.companyId,
                companyName: c.companyName,
                industry: industry,
                created_at: c.created_at,
                profiles: {
                    id: c.user_id,
                    email: ownerEmail,
                    full_name: ownerName
                },
                contentCount: totalContent || 0,
                imageCount: totalImages || 0,
                usage: estimatedCredits,
                totalSpend: totalSpend
            };
        }));

        return res.status(200).json({ companies: formattedCompanies });
    } catch (error) {
        console.error('Unexpected admin controller error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const { data: logs, error } = await db
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching audit logs:', error);
            return res.status(500).json({ error: 'Failed to fetch audit logs' });
        }

        return res.status(200).json({ logs });
    } catch (error) {
        console.error('Unexpected admin controller error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const logImpersonation = async (req, res) => {
    try {
        const { targetUserId, action } = req.body; // action: 'START' or 'STOP'
        const adminId = req.user.id;

        if (action === 'START') {
            await logAudit(adminId, 'IMPERSONATION_START', 'user', targetUserId, {
                message: `Admin started viewing as user ${targetUserId}`
            });
        } else {
            await logAudit(adminId, 'IMPERSONATION_STOP', 'user', targetUserId, {
                message: `Admin stopped viewing as user ${targetUserId}`
            });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Error logging impersonation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSystemHealth = async (req, res) => {
    try {
        const health = {
            database: { status: 'healthy', latency: '0ms' },
            openai: { status: 'checking', message: '' },
            gemini: { status: 'checking', message: '' },
            fal_ai: { status: 'checking', message: '' },
            replicate: { status: 'checking', message: '' },
            storage: { status: 'healthy', provider: 'Supabase Storage' },
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };

        const start = Date.now();
        const { error: dbError } = await db.from('profiles').select('id').limit(1);
        health.database.latency = `${Date.now() - start}ms`;
        if (dbError) health.database.status = 'unhealthy';

        // 1. Check OpenAI
        try {
            const openAiRes = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
            });
            if (openAiRes.ok) {
                health.openai = { status: 'healthy', message: 'API Key Active' };
            } else {
                const err = await openAiRes.json().catch(() => ({}));
                health.openai = { status: 'unhealthy', message: err?.error?.message || 'Unauthorized/Invalid Key' };
            }
        } catch (e) {
            health.openai = { status: 'unhealthy', message: 'Connection Failed' };
        }

        // 2. Check Gemini
        try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
            if (geminiRes.ok) {
                health.gemini = { status: 'healthy', message: 'API Key Active' };
            } else {
                const err = await geminiRes.json().catch(() => ({}));
                health.gemini = { status: 'unhealthy', message: err?.error?.message || 'Invalid Key' };
            }
        } catch (e) {
            health.gemini = { status: 'unhealthy', message: 'Connection Failed' };
        }

        // 3. Check Fal.ai
        try {
            if (!process.env.FAL_KEY) {
                health.fal_ai = { status: 'unhealthy', message: 'Missing FAL_KEY' };
            } else {
                health.fal_ai = { status: 'healthy', message: 'Key Present' };
            }
        } catch (e) {
            health.fal_ai = { status: 'unhealthy', message: 'Check Failed' };
        }

        // 4. Check Replicate
        try {
            const repRes = await fetch('https://api.replicate.com/v1/models', {
                headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }
            });
            if (repRes.ok) {
                health.replicate = { status: 'healthy', message: 'Token Active' };
            } else {
                const err = await repRes.json().catch(() => ({}));
                health.replicate = { status: 'unhealthy', message: err?.detail || 'Invalid Token' };
            }
        } catch (e) {
            health.replicate = { status: 'unhealthy', message: 'Connection Failed' };
        }

        return res.status(200).json({ health });
    } catch (error) {
        console.error('Error checking system health:', error);
        return res.status(500).json({ error: 'Failed to probe system health' });
    }
};

export const getSystemSettings = async (req, res) => {
    try {
        const { data: settings, error } = await db
            .from('system_settings')
            .select('*');

        if (error) {
            console.error('Error fetching settings:', error);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = { value: curr.value, description: curr.description };
            return acc;
        }, {});

        return res.status(200).json({ settings: settingsMap });
    } catch (error) {
        console.error('Error getting settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSystemSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Setting key is required' });

        const { error } = await db
            .from('system_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

        if (error) {
            console.error('Error updating setting:', error);
            return res.status(500).json({ error: 'Failed to update setting' });
        }

        await logAudit(req.user.id, 'SYSTEM_SETTING_UPDATE', 'system_setting', key, { new_value: value });

        return res.status(200).json({ message: 'Setting updated successfully' });
    } catch (error) {
        console.error('Error updating setting:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendBroadcast = async (req, res) => {
    try {
        const { title, message, type = 'info' } = req.body;
        const adminId = req.user.id;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }

        const { data: users, error: usersError } = await db.from('profiles').select('id');
        if (usersError) throw usersError;

        const notifications = users.map(u => ({
            user_id: u.id,
            title,
            message,
            type,
            triggered_by_name: 'System Admin'
        }));

        const { error: notifyError } = await db.from('notifications').insert(notifications);
        if (notifyError) throw notifyError;

        await logAudit(adminId, 'SYSTEM_BROADCAST', 'system', 'global', {
            title,
            recipient_count: users.length
        });

        return res.status(200).json({ ok: true, count: users.length });
    } catch (error) {
        console.error('Error sending broadcast:', error);
        return res.status(500).json({ error: 'Failed to send broadcast' });
    }
};

export const clearAuditLogs = async (req, res) => {
    try {
        const { days = 30 } = req.body;
        const adminId = req.user.id;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { error, count } = await db
            .from('audit_logs')
            .delete({ count: 'exact' })
            .lt('created_at', cutoffDate.toISOString());

        if (error) throw error;

        await logAudit(adminId, 'LOGS_PURGE', 'system', 'logs', {
            days_retained: days,
            logs_deleted: count
        });

        return res.status(200).json({ ok: true, deletedCount: count });
    } catch (error) {
        console.error('Error clearing logs:', error);
        return res.status(500).json({ error: 'Failed to clear old logs' });
    }
};

export const adminDeleteCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const adminId = req.user.id;

        // Fetch company name first for logging
        const { data: company, error: fetchError } = await db
            .from('company')
            .select('companyName')
            .eq('companyId', companyId)
            .single();

        if (fetchError) throw fetchError;

        const { error: deleteError } = await db
            .from('company')
            .delete()
            .eq('companyId', companyId);

        if (deleteError) throw deleteError;

        await logAudit(adminId, 'COMPANY_DELETE_ADMIN', 'company', companyId, {
            companyName: company.companyName
        });

        return res.status(200).json({ message: 'Company deleted by admin' });
    } catch (error) {
        console.error('Error deleting company as admin:', error);
        return res.status(500).json({ error: 'Failed to delete company' });
    }
}
