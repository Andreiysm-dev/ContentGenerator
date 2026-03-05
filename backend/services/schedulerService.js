
import cron from 'node-cron';
import { supabase } from '../database/db.js';
import { postToLinkedIn, postToFacebookPage } from './socialService.js';
import { sendNotificationSummary } from './emailService.js';

let isChecking = false;

export const initScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        if (isChecking) {
            console.log('Scheduler already running, skipping this tick...');
            return;
        }
        isChecking = true;
        try {
            await checkScheduledPosts();
        } finally {
            isChecking = false;
        }
    });
};

export const initEmailScheduler = () => {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            await checkPendingEmailNotifications();
        } catch (err) {
            console.error('[EmailScheduler] Tick failed:', err);
        }
    });
};

const checkPendingEmailNotifications = async () => {
    try {
        // 1. Fetch notifications that haven't been emailed yet
        // In notifications table, we assume 'email_notified' column exists (default false)
        const { data: unsent, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('email_notified', false)
            .order('created_at', { ascending: true });

        if (error || !unsent || unsent.length === 0) return;

        // 2. Group by user_id
        const userGroups = {};
        unsent.forEach(n => {
            if (!userGroups[n.user_id]) userGroups[n.user_id] = [];
            userGroups[n.user_id].push(n);
        });

        const userIds = Object.keys(userGroups);

        // 3. Fetch user preference and email for each
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError || !users) return;

        for (const userId of userIds) {
            const user = users.find(u => u.id === userId);
            if (!user) continue;

            const userNotifications = userGroups[userId];
            // Group by companyId
            const companyGroups = {};
            userNotifications.forEach(n => {
                const cid = n.link?.split('/company/')?.[1]?.split('/')?.[0] || 'unknown';
                if (!companyGroups[cid]) companyGroups[cid] = [];
                companyGroups[cid].push(n);
            });

            for (const companyId of Object.keys(companyGroups)) {
                // Check if user has email notifications turned on for this specific company in metadata
                const prefs = user.user_metadata?.notification_preferences?.[companyId] || {};
                if (prefs.emailNotificationsEnabled !== true) continue;

                const companyNotifications = companyGroups[companyId];
                const companyName = companyNotifications[0].company_name || 'Company';

                try {
                    await sendNotificationSummary({
                        userEmail: user.email,
                        userName: user.user_metadata?.full_name || user.email,
                        notifications: companyNotifications,
                        companyName,
                        companyId
                    });

                    // 4. Mark these as notified
                    const notificationIds = companyNotifications.map(n => n.id);
                    await supabase
                        .from('notifications')
                        .update({ email_notified: true })
                        .in('id', notificationIds);

                } catch (emailErr) {
                    console.error(`[EmailScheduler] Failed for user ${userId}:`, emailErr);
                }
            }
        }
    } catch (err) {
        console.error('[EmailScheduler] Check failed:', err);
    }
};

const checkScheduledPosts = async () => {
    try {
        // Query for posts scheduled in the past or now
        const now = new Date().toISOString();
        const { data: postsToProcess, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('status', 'PENDING')
            .lte('scheduled_at', now);

        if (error) {
            console.error('Error fetching scheduled posts:', error.message);
            return;
        }

        if (postsToProcess && postsToProcess.length > 0) {

            for (const post of postsToProcess) {
                await processPost(post);
            }
        }
    } catch (err) {
        console.error('Scheduler check failed:', err);
    }
};

const processPost = async (post) => {
    if (!post.id) return;

    // 1. Lock the post
    const { data: lockCheck, error: lockError } = await supabase
        .from('scheduled_posts')
        .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
        .eq('id', post.id)
        .eq('status', 'PENDING') // Atomic check
        .select();

    if (lockError || !lockCheck || lockCheck.length === 0) {
        return; // Someone else got it
    }

    try {
        if (!post.company_id) throw new Error('No company_id associated with post');

        const accountIds = (post.account_ids || []).filter(id =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        );
        const content = post.content || '';
        const mediaUrls = post.media_urls || [];
        const imageUrl = mediaUrls.length > 0 ? mediaUrls[0] : null; // Start with single image support

        // 2. Fetch account details
        let accounts = [];

        if (accountIds.length > 0) {
            const { data: fetchedAccounts, error: fetchErr } = await supabase
                .from('social_accounts')
                .select('id, provider')
                .in('id', accountIds);

            if (fetchErr) {
                console.error('Error fetching social accounts:', fetchErr);
            }

            accounts = fetchedAccounts || [];
        }

        // 3. Post to each account
        const results = [];
        let successCount = 0;

        for (const account of accounts) {
            try {
                let res;
                if (account.provider === 'facebook') {
                    res = await postToFacebookPage(post.company_id, { text: content, url: imageUrl }, account.id);
                } else {
                    // Default to LinkedIn
                    res = await postToLinkedIn(post.company_id, { text: content, url: imageUrl }, account.id);
                }
                results.push({ provider: account.provider, accountId: account.id, result: res, status: 'success' });
                successCount++;
            } catch (err) {
                console.error(`Failed to post to ${account.provider}:`, err);
                results.push({ provider: account.provider, accountId: account.id, error: err.message, status: 'failed' });
            }
        }

        // 4. Finalize Status
        // If at least one succeeded, we consider it PUBLISHED (with partial errors in result)
        // If all failed, it's FAILED
        const finalStatus = successCount > 0 ? 'PUBLISHED' : (accounts.length === 0 ? 'FAILED' : 'FAILED'); // Fail if no accounts found

        await supabase
            .from('scheduled_posts')
            .update({
                status: finalStatus,
                updated_at: new Date().toISOString(),
                publish_result: JSON.stringify(results)
            })
            .eq('id', post.id);

        // 5. Update Original Content Calendar (if linked)
        if (post.content_calendar_id && finalStatus === 'PUBLISHED') {
            await supabase
                .from('contentCalendar')
                .update({
                    status: 'PUBLISHED',
                    // We can also store the result blob there if needed, but keeping it light is better
                })
                .eq('contentCalendarId', post.content_calendar_id);
        }



    } catch (error) {
        console.error(`Critically failed to process post ${post.id}:`, error);
        await supabase
            .from('scheduled_posts')
            .update({ status: 'FAILED', publish_result: JSON.stringify({ error: error.message }) })
            .eq('id', post.id);
    }
};
