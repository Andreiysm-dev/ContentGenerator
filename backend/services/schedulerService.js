
import cron from 'node-cron';
import { supabase } from '../database/db.js';
import { postToLinkedIn, postToFacebookPage } from './socialService.js';

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
