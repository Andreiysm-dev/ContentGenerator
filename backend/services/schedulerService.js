
import cron from 'node-cron';
import { supabase } from '../database/db.js';
import { postToLinkedIn, postToFacebookPage } from './socialService.js';

export const initScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        await checkScheduledPosts();
    });
};

const checkScheduledPosts = async () => {
    try {
        // Query for posts scheduled in the past/now and status is 'SCHEDULED'
        // Note: If status is a text column, use 'SCHEDULED'. If JSONB, use '"SCHEDULED"'.
        // The error 'Token "SCHEDULED" is invalid' suggests it's treating it as JSON, so let's try double quotes.
        const { data: posts, error } = await supabase
            .from('contentCalendar')
            .select('*')
            .eq('status', '"SCHEDULED"')
            .lte('scheduled_at', new Date().toISOString());

        if (error) {
            console.error('Error fetching scheduled posts:', error);
            return;
        }

        if (posts && posts.length > 0) {
            for (const post of posts) {
                await processPost(post);
            }
        }
    } catch (err) {
        console.error('Scheduler check failed:', err);
    }
};

const processPost = async (post) => {

    // Optimistic update to prevent double processing? 
    // Ideally use explicit locking if scale is high, but for now simple update.
    // However, status update happens at end. 
    // To be safe, we could mark as 'PROCESSING' first?
    if (post.contentCalendarId) {
        await updateStatus(post.contentCalendarId, 'PROCESSING');
    }

    try {
        const content = {
            text: [post.finalCaption, post.finalHashtags].filter(Boolean).join('\n\n'),
            url: post.imageUrl
        };

        if (!post.companyId) {
            throw new Error('No companyId associated with post');
        }

        const channel = (post.channels || '').toLowerCase();
        let result;
        let provider;

        if (channel.includes('facebook')) {
            result = await postToFacebookPage(post.companyId, content);
            provider = 'facebook';
        } else {
            // Default to LinkedIn for now
            result = await postToLinkedIn(post.companyId, content);
            provider = 'linkedin';
        }

        const socialPostId = result?.id || result?.post_id || result?.id?.activity;

        // Update status to PUBLISHED and store tracking info
        await updateStatus(post.contentCalendarId, 'PUBLISHED', {
            published_at: new Date().toISOString(),
            social_post_id: socialPostId,
            social_provider: provider
        });

    } catch (error) {
        console.error(`Failed to publish post ${post.contentCalendarId || 'unknown'}:`, error);
        if (post.contentCalendarId) {
            await updateStatus(post.contentCalendarId, 'FAILED', { error: error.message });
        }
    }
};

const updateStatus = async (id, status, extraData = {}) => {
    // If status is a string, ensure it's treated as such. 
    // If column is JSONB, simple string update might work if Supabase handles it, 
    // or we might need to wrap it. Let's try standard update first.
    const { error } = await supabase
        .from('contentCalendar')
        .update({ status, ...extraData })
        .eq('contentCalendarId', id);

    if (error) console.error(`Failed to update status for post ${id}:`, error);
};
