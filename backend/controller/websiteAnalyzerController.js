import { analyzeWebsite } from '../services/websiteAnalyzerService.js';

/**
 * Analyze a website URL to extract brand information
 * POST /api/analyze-website
 */
export const analyzeWebsiteUrl = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                error: 'Website URL is required',
            });
        }

        // Validate URL format (basic)
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(url)) {
            return res.status(400).json({
                error: 'Invalid URL format',
            });
        }

        // Analyze website
        const result = await analyzeWebsite(url);

        if (!result.success) {
            return res.status(500).json({
                error: 'Failed to analyze website',
                details: result.error,
            });
        }

        return res.status(200).json({
            success: true,
            brandData: result.data,
        });
    } catch (error) {
        console.error('Website analyzer error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
};
