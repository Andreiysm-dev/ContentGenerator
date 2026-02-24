import db from '../database/db.js';

// Cost per 1M tokens in USD
const TOKEN_COSTS = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

// Cost per unit (Image)
const IMAGE_COSTS = {
    'imagen-4.0-generate-001': 0.04,
    'fal-ai/flux-pro/v1.1': 0.035,
    'black-forest-labs/flux-dev': 0.03,
};

/**
 * Logs API usage and calculates estimated cost
 */
export async function logApiUsage({
    companyId,
    userId,
    provider,
    model,
    type,
    inputTokens = 0,
    outputTokens = 0,
    metadata = {}
}) {
    try {
        let cost = 0;

        if (type === 'completion' && TOKEN_COSTS[model]) {
            cost = (inputTokens / 1_000_000 * TOKEN_COSTS[model].input) +
                (outputTokens / 1_000_000 * TOKEN_COSTS[model].output);
        } else if (type === 'image_generation') {
            cost = IMAGE_COSTS[model] || 0.035; // Default to Fal.ai pricing if unknown
        }

        const { error } = await db
            .from('api_usage_logs')
            .insert({
                company_id: companyId,
                user_id: userId,
                provider,
                model,
                type,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                estimated_cost: cost,
                metadata,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('[logApiUsage] Database error:', error);
        }

        return cost;
    } catch (err) {
        console.error('[logApiUsage] Unexpected error:', err);
        return 0;
    }
}

/**
 * Gets aggregated spend for a company or overall
 */
export async function getApiSpendStats(companyId = null) {
    try {
        let query = db.from('api_usage_logs').select('estimated_cost');
        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.reduce((acc, curr) => acc + (Number(curr.estimated_cost) || 0), 0);
    } catch (err) {
        console.error('[getApiSpendStats] Error:', err);
        return 0;
    }
}
