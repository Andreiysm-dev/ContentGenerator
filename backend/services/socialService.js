import axios from 'axios';
import { supabase } from '../database/db.js';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export const postToLinkedIn = async (companyId, content) => {
    const { text, url, visibility = 'PUBLIC' } = content;

    // 1. Get Access Token
    const { data: account, error } = await supabase
        .from('social_accounts')
        .select('provider_account_id, access_token')
        .eq('company_id', companyId)
        .eq('provider', 'linkedin')
        .single();

    if (error || !account) {
        throw new Error('LinkedIn account not connected.');
    }

    const { provider_account_id, access_token } = account;

    // 2. Construct Payload
    // Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
    const payload = {
        author: `urn:li:person:${provider_account_id}`, // Note: 'person' vs 'organization'. If using 'w_member_social', it's person.
        lifecycleState: 'PUBLISHED',
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: text
                },
                shareMediaCategory: "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility
        }
    };

    // If we have a URL (article share) or Image (coming soon)
    // For now, if there's a URL, let's append it to text or use ARTICLE share.
    // Appending to text is safer for 'NONE' category.
    if (url) {
        payload.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text += `\n\n${url}`;
    }

    // TODO: Implement Image Upload (3-step process)
    // 1. Register Upload -> 2. PUT binary -> 3. Use Asset URN here.

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
        console.error('LinkedIn Post Error:', err.response?.data || err.message);
        // Handle Token Expiry? (401)
        if (err.response?.status === 401) {
            // Mark account as disconnected or needing re-auth?
        }
        throw new Error(`Failed to post to LinkedIn: ${JSON.stringify(err.response?.data || err.message)}`);
    }
};
