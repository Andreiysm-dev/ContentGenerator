import axios from 'axios';
import { supabase } from '../database/db.js';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

// Helper to delay execution
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

export const postToLinkedIn = async (companyId, content, accountId = null) => {
    // Destructure input
    // content = { text, url, visibility }
    const { text, url, visibility = 'PUBLIC' } = content;

    // 1. Get Access Token
    let query = supabase
        .from('social_accounts')
        .select('provider_account_id, access_token, id')
        .eq('company_id', companyId)
        .eq('provider', 'linkedin');

    if (accountId) {
        query = query.eq('id', accountId);
    }

    const { data: account, error } = await query.single();

    if (error || !account) {
        throw new Error('LinkedIn account not connected or found.');
    }

    const { provider_account_id: personUrnParam, access_token } = account;
    // Ensure personUrn is just the ID part if stored as full URN, or construct full URN
    // Usually stored as ID like '12345'
    const authorUrn = personUrnParam.startsWith('urn:li:person:') ? personUrnParam : `urn:li:person:${personUrnParam}`;

    // 2. Handle Image Upload if URL exists
    let assetUrn = null;
    if (url) {
        try {
            console.log('Starting LinkedIn image upload for:', url);

            // A. Register Upload
            const registerResponse = await axios.post(`${LINKEDIN_API_URL}/assets?action=registerUpload`, {
                registerUploadRequest: {
                    recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                    owner: authorUrn,
                    serviceRelationships: [{
                        relationshipType: "OWNER",
                        identifier: "urn:li:userGeneratedContent"
                    }]
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json'
                }
            });

            const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            assetUrn = registerResponse.data.value.asset;

            // B. Download Image Content
            const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
            const imageBuffer = imageResponse.data;
            const contentType = imageResponse.headers['content-type'];

            // C. Upload Binary to LinkedIn's URL
            await axios.put(uploadUrl, imageBuffer, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/octet-stream' // LinkedIn requires this for the binary upload, not the actual mime type
                }
            });

            // D. Poll for Asset Status (Wait until 'AVAILABLE')
            // LinkedIn assets aren't immediately usable after upload.
            let isAvailable = false;
            let checks = 0;
            while (!isAvailable && checks < 5) {
                await sleep(1000); // Wait 1s
                try {
                    // Extract ID from asset URN: urn:li:digitalmediaAsset:123 -> 123
                    const assetId = assetUrn.split(':').pop();
                    const statusRes = await axios.get(`${LINKEDIN_API_URL}/assets/${assetId}`, {
                        headers: {
                            'Authorization': `Bearer ${access_token}`,
                            'X-Restli-Protocol-Version': '2.0.0'
                        }
                    });
                    // Note: LinkedIn V2 Assets API response structure might vary, 
                    // but typically if we get here without error it implies existence. 
                    // The 'recipes' status check is complex. 
                    // For now, a simple delay is often enough, but let's assume if no 404, it's indexing.
                    // Actually, simpler: Just wait 2-3 seconds blindly is safer than complex polling for MVP.
                    isAvailable = true;
                } catch (e) {
                    // If 404, wait.
                    checks++;
                }
            }
            await sleep(2000); // Safety buffer

        } catch (uploadError) {
            console.error('Failed to upload image to LinkedIn:', uploadError?.response?.data || uploadError.message);
            // Don't fallback to text-only if image was expected, it's better to fail or let user know.
            // But for now, we leave assetUrn null, which might make it a text post.
            throw new Error('Image upload to LinkedIn failed.');
        }
    }

    // 3. Construct Payload
    // Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
    const shareContent = {
        shareCommentary: {
            text: text
        },
        shareMediaCategory: assetUrn ? "IMAGE" : "NONE"
    };

    if (assetUrn) {
        shareContent.media = [{
            status: "READY",
            description: { text: "Generated by StartupLab Content Generator" },
            media: assetUrn,
            title: { text: "Post Image" }
        }];
    }

    const payload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
            "com.linkedin.ugc.ShareContent": shareContent
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility
        }
    };

    try {
        const response = await axios.post(`${LINKEDIN_API_URL}/ugcPosts`, payload, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (err) {
        console.error('LinkedIn final post error:', err.response?.data || err.message);
        throw new Error(`LinkedIn publish failed: ${err.response?.data?.message || err.message}`);
    }
};

/**
 * Publishes a post to a Facebook Page.
 * @param {string} companyId 
 * @param {object} content { text, url }
 */
// Helper for Facebook publishing
export const postToFacebookPage = async (companyId, content, accountId = null) => {
    // content = { text, url }
    const { text, url } = content;

    // 1. Get Page Access Token and Page ID from DB
    let query = supabase
        .from('social_accounts')
        .select('provider_account_id, access_token')
        .eq('company_id', companyId)
        .eq('provider', 'facebook');

    if (accountId) {
        query = query.eq('id', accountId);
    }

    const { data: account, error } = await query.single();

    if (error || !account) {
        throw new Error('Facebook Page account not connected or found.');
    }

    const { provider_account_id: pageId, access_token: pageAccessToken } = account;
    const FB_GRAPH_URL = `https://graph.facebook.com/v18.0/${pageId}`;

    try {
        let response;
        if (url) {
            // Posting with Image
            // IMPORTANT: 'url' param in FB Graph API often requires a public URL.
            // If it's a signed URL or local, we might need to upload bytes, but 'url' is standard for public hosted images.
            response = await axios.post(`${FB_GRAPH_URL}/photos`, {
                url: url,
                message: text, // 'message' is caption for photos
                access_token: pageAccessToken
            });
        } else {
            // Text-only post
            response = await axios.post(`${FB_GRAPH_URL}/feed`, {
                message: text,
                access_token: pageAccessToken
            });
        }

        return response.data;

    } catch (err) {
        // Detailed FB Error Logging
        const fbError = err.response?.data?.error;
        console.error('Facebook Page publish error full:', JSON.stringify(err.response?.data || {}, null, 2));
        throw new Error(`Facebook publish failed: ${fbError?.message || err.message} (Code: ${fbError?.code})`);
    }
};

/**
 * Fetches insights for a specific Facebook post.
 * @param {string} companyId 
 * @param {string} postId The Facebook post ID (global ID)
 * @returns {object} { reach, likes, comments }
 */
export const getFacebookPostInsights = async (companyId, postId) => {
    // 1. Get Page Access Token from DB
    const { data: account, error } = await supabase
        .from('social_accounts')
        .select('access_token')
        .eq('company_id', companyId)
        .eq('provider', 'facebook')
        .single();

    if (error || !account) {
        throw new Error('Facebook account not connected.');
    }

    const { access_token } = account;

    // 2. Fetch Insights
    // post_impressions_unique = Reach
    // summary(true) for likes and comments
    const FB_GRAPH_URL = `https://graph.facebook.com/v18.0/${postId}`;

    try {
        const [insightsRes, countsRes] = await Promise.all([
            axios.get(`${FB_GRAPH_URL}/insights?metric=post_impressions_unique&access_token=${access_token}`),
            axios.get(`${FB_GRAPH_URL}?fields=likes.summary(true),comments.summary(true)&access_token=${access_token}`)
        ]);

        const reach = insightsRes.data.data?.[0]?.values?.[0]?.value || 0;
        const likes = countsRes.data.likes?.summary?.total_count || 0;
        const comments = countsRes.data.comments?.summary?.total_count || 0;

        return {
            reach,
            likes,
            comments
        };
    } catch (err) {
        console.error('Facebook insights error:', err.response?.data || err.message);
        throw new Error(`Failed to fetch Facebook insights: ${err.response?.data?.error?.message || err.message}`);
    }
};
