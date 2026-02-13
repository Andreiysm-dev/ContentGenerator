import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Analyzes a website URL to extract comprehensive brand information
 * @param {string} url - The website URL to analyze
 * @returns {Promise<Object>} Extracted brand data
 */
export async function analyzeWebsite(url) {
    try {
        // Normalize URL
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        // Fetch website HTML with timeout
        const response = await axios.get(normalizedUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract comprehensive brand information
        // Log the extraction results for debugging
        console.log(`[WebsiteAnalyzer] Analyzing ${normalizedUrl}...`);

        const brandData = {
            companyName: extractCompanyName($, normalizedUrl),
            description: extractDescription($),
            industry: extractIndustry($),
            keywords: extractKeywords($),
            targetAudience: extractTargetAudience($),
            valuePropositions: extractValuePropositions($),
            missionStatement: extractMission($),
            contentPillars: extractContentPillars($, extractIndustry($)),
            primaryPlatform: extractPrimaryPlatform($),
            brandVoice: analyzeBrandVoice($),
            visualIdentity: extractVisualIdentity($, html),
            businessModel: analyzeBusinessModel($),
            socialProof: extractSocialProof($),
            competitiveEdge: extractCompetitiveEdge($),
        };

        console.log('[WebsiteAnalyzer] Extracted Data:', JSON.stringify(brandData, null, 2));

        return {
            success: true,
            data: brandData,
        };
    } catch (error) {
        console.error('Website analysis error:', error.message);
        return {
            success: false,
            error: error.message,
            data: null,
        };
    }
}

/**
 * Extract company name from various sources
 */
function extractCompanyName($, url) {
    // Try og:site_name
    let name = $('meta[property="og:site_name"]').attr('content');

    // Try title tag
    if (!name) {
        const title = $('title').text();
        name = title.split('|')[0].split('-')[0].trim();
    }

    // Try domain name as fallback
    if (!name) {
        const domain = new URL(url).hostname.replace('www.', '');
        name = domain.split('.')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return name || 'Unknown Company';
}

function extractMission($) {
    // 1. Look for explicit mission meta tags
    // 2. Look for "Mission" in headings
    // 3. Fallback to description

    // Explicit search text
    const bodyText = $('body').text().slice(0, 5000).toLowerCase(); // Limit search scope

    const missionPatterns = [
        /our mission is to ([^.]+)/i,
        /we exist to ([^.]+)/i,
        /driven by a mission to ([^.]+)/i
    ];

    for (const pattern of missionPatterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
            return `To ${match[1].trim()}`;
        }
    }

    // Heuristics: headings
    let mission = '';
    $('h1, h2, h3, h4').each((i, el) => {
        const text = $(el).text().trim();
        if (text.toLowerCase().includes('mission')) {
            const nextP = $(el).next('p').text().trim();
            if (nextP.length > 10 && nextP.length < 300) {
                mission = nextP;
                return false; // break
            }
        }
    });

    if (mission) return mission;

    // Fallback: Use generic description but formatted as a mission
    return extractDescription($) || "To deliver excellence in our industry.";
}

function extractPrimaryPlatform($) {
    const socialDomains = {
        'linkedin.com': 'LinkedIn',
        'twitter.com': 'Twitter',
        'x.com': 'Twitter',
        'instagram.com': 'Instagram',
        'facebook.com': 'Facebook',
        'youtube.com': 'YouTube',
        'tiktok.com': 'TikTok'
    };

    const found = {};
    $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        for (const [domain, name] of Object.entries(socialDomains)) {
            if (href.includes(domain)) {
                found[name] = (found[name] || 0) + 1;
            }
        }
    });

    // Default to LinkedIn for B2B (heuristic based on typical Startuplab users) or max count
    let top = 'LinkedIn';
    let max = -1;

    for (const [name, count] of Object.entries(found)) {
        if (count > max) {
            max = count;
            top = name;
        }
    }

    // If no socials found, generic fallback
    if (Object.keys(found).length === 0) return 'LinkedIn';

    return top;
}

function extractContentPillars($, industry) {
    // Infer 3 pillars based on industry + keywords
    const keywords = extractKeywords($);
    const defaults = {
        'Marketing & Advertising': ['Digital Strategy', 'Growth Hacks', 'Agency Life'],
        'E-commerce': ['New Arrivals', 'Style Tips', 'Behind the Scenes'],
        'SaaS / Software': ['Product Updates', 'Industry Trends', 'User Success Stories'],
        'Finance': ['Financial Tips', 'Market Analysis', 'Wealth Management'],
        'Healthcare': ['Health & Wellness', 'Patient Care', 'Medical Innovations'],
        'Real Estate': ['Market Updates', 'Dream Homes', 'Home Buying Tips'],
        'Education': ['Learning Tips', 'Student Success', 'Course Highlights']
    };

    let basePillars = defaults[industry] || ['Company News', 'Industry Insights', 'Team Culture'];

    // Improve with keywords if available
    if (keywords.length > 0) {
        // Try to replace generic ones with top keywords if they look like topics
        // simple heuristic: take top 2 keywords and capitalize
        const customPillars = keywords.slice(0, 2).map(k => k.charAt(0).toUpperCase() + k.slice(1));
        if (customPillars.length > 0) {
            basePillars = [...customPillars, basePillars[basePillars.length - 1]];
        }
    }

    return basePillars;
}

/**
 * Extract description from meta tags
 */
function extractDescription($) {
    // Try various meta description tags
    let description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content');

    // Fallback to first paragraph
    if (!description) {
        const firstP = $('p').first().text().trim();
        description = firstP.substring(0, 200);
    }

    return description || '';
}

/**
 * Extract industry keywords
 */
function extractIndustry($) {
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const description = extractDescription($);
    const text = (keywords + ' ' + description).toLowerCase();

    // Industry mapping
    const industries = {
        'Marketing & Advertising': ['marketing', 'advertising', 'agency', 'digital marketing', 'seo', 'ppc'],
        'E-commerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'online store'],
        'SaaS / Software': ['saas', 'software', 'platform', 'app', 'application', 'cloud'],
        'Finance': ['finance', 'banking', 'investment', 'fintech', 'payment', 'insurance'],
        'Healthcare': ['health', 'medical', 'healthcare', 'clinic', 'hospital', 'wellness'],
        'Real Estate': ['real estate', 'property', 'housing', 'realty', 'homes'],
        'Education': ['education', 'learning', 'school', 'university', 'course', 'training'],
        'Hospitality': ['hotel', 'restaurant', 'hospitality', 'travel', 'tourism'],
    };

    for (const [industry, terms] of Object.entries(industries)) {
        if (terms.some(term => text.includes(term))) {
            return industry;
        }
    }

    // Attempt to return a specific industry from keywords/og:type before defaulting
    const keywordsList = extractKeywords($);
    if (keywordsList.length > 0) {
        // Return the first keyword capitalized as the industry guess
        const potentialIndustry = keywordsList[0];
        return potentialIndustry.charAt(0).toUpperCase() + potentialIndustry.slice(1);
    }

    return 'General Business';
}

/**
 * Extract keywords from meta tags
 */
function extractKeywords($) {
    const keywords = $('meta[name="keywords"]').attr('content');
    return keywords ? keywords.split(',').map(k => k.trim()).slice(0, 10) : [];
}

/**
 * Extract target audience information
 */
function extractTargetAudience($) {
    const allText = $('body').text().toLowerCase();

    // Look for audience indicators
    const audienceIndicators = {
        'Business Owners': ['business owner', 'entrepreneur', 'ceo', 'founder', 'startup'],
        'Marketers': ['marketer', 'marketing team', 'marketing professional', 'growth team'],
        'Developers': ['developer', 'engineer', 'programmer', 'technical team', 'dev team'],
        'Designers': ['designer', 'creative', 'design team', 'ux', 'ui'],
        'Sales Teams': ['sales team', 'sales professional', 'account executive', 'sales rep'],
        'Small Businesses': ['small business', 'smb', 'local business', 'small team'],
        'Enterprises': ['enterprise', 'large organization', 'corporation', 'fortune 500'],
    };

    let detectedRole = 'Business Professionals';
    for (const [role, terms] of Object.entries(audienceIndicators)) {
        if (terms.some(term => allText.includes(term))) {
            detectedRole = role;
            break;
        }
    }

    // Extract pain points (look for problem-solution language)
    const painPoints = [];
    const painPointPatterns = [
        /struggling with ([^.!?]+)/gi,
        /tired of ([^.!?]+)/gi,
        /frustrated by ([^.!?]+)/gi,
        /problem[s]? with ([^.!?]+)/gi,
        /challenge[s]? of ([^.!?]+)/gi,
    ];

    painPointPatterns.forEach(pattern => {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && painPoints.length < 3) {
                painPoints.push(match[1].trim().substring(0, 100));
            }
        }
    });

    // Extract desired outcomes (look for benefit language)
    const outcomes = [];
    const outcomePatterns = [
        /help you ([^.!?]+)/gi,
        /achieve ([^.!?]+)/gi,
        /get ([^.!?]+) faster/gi,
        /increase ([^.!?]+)/gi,
        /improve ([^.!?]+)/gi,
    ];

    outcomePatterns.forEach(pattern => {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && outcomes.length < 3) {
                outcomes.push(match[1].trim().substring(0, 100));
            }
        }
    });

    return {
        role: detectedRole,
        painPoints: painPoints.length > 0 ? painPoints : ['Common industry challenges'],
        outcomes: outcomes.length > 0 ? outcomes : ['Better business results'],
    };
}

/**
 * Extract value propositions from hero sections and features
 */
function extractValuePropositions($) {
    const valueProps = [];

    // Extract from h1, h2 (hero sections)
    $('h1, h2').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 10 && text.length < 150 && valueProps.length < 5) {
            valueProps.push(text);
        }
    });

    // Extract from feature lists
    $('ul li, ol li').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 15 && text.length < 100 && valueProps.length < 8) {
            valueProps.push(text);
        }
    });

    return valueProps.slice(0, 5);
}

/**
 * Analyze brand voice and tone with numeric scores
 */
function analyzeBrandVoice($) {
    const headings = $('h1, h2, h3').text().toLowerCase();
    const paragraphs = $('p').text().toLowerCase().substring(0, 5000);
    const text = headings + ' ' + paragraphs;

    // Helper: Calculate score 1-10 based on keyword matches
    const calculateScore = (text, positiveKeywords, negativeKeywords) => {
        let score = 5; // Start neutral

        positiveKeywords.forEach(word => {
            const matches = text.split(word).length - 1;
            score += matches * 0.5;
        });

        negativeKeywords.forEach(word => {
            const matches = text.split(word).length - 1;
            score -= matches * 0.5;
        });

        return Math.max(1, Math.min(10, Math.round(score)));
    };

    // Formality analysis
    const formalWords = ['enterprise', 'professional', 'solution', 'optimize', 'leverage', 'utilize', 'strategic', 'comprehensive', 'methodology'];
    const casualWords = ['hey', 'awesome', 'cool', 'easy', 'simple', 'fun', 'love', 'chat', 'quick', 'snap'];
    const formalScore = calculateScore(text, formalWords, casualWords);

    // Energy analysis
    const energeticWords = ['!', 'amazing', 'incredible', 'transform', 'revolutionary', 'powerful', 'boost', 'explode', 'turbo', 'fast'];
    const calmWords = ['reliable', 'steady', 'consistent', 'stable', 'trusted', 'peace', 'secure', 'calm', 'balance'];
    const energyScore = calculateScore(text, energeticWords, calmWords);

    // Boldness analysis
    const boldWords = ['best', 'leading', 'top', '#1', 'guaranteed', 'proven', 'dominant', 'unrivaled', 'ultimate'];
    const humbleWords = ['help', 'support', 'assist', 'guide', 'partner', 'community', 'serve', 'together'];
    const boldScore = calculateScore(text, boldWords, humbleWords);

    // Emoji Usage
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
    const hasEmojis = emojiRegex.test(text);
    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/ug) || []).length;
    let emojiUsage = 'Rarely';
    if (emojiCount > 5) emojiUsage = 'Often';
    else if (emojiCount > 0) emojiUsage = 'Sometimes';

    // Writing Length
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const avgLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / (sentences.length || 1);
    let writingLength = 'Medium';
    if (avgLength < 10) writingLength = 'Short';
    else if (avgLength > 25) writingLength = 'Long';

    return {
        formality: formalScore, // 1-10
        energy: energyScore,   // 1-10
        confidence: boldScore, // 1-10 (mapped to 'bold')
        emojiUsage,
        writingLength
    };
}

function analyzeBusinessModel($) {
    const text = $('body').text().toLowerCase().substring(0, 5000);
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const combined = text + ' ' + keywords;

    // B2B vs B2C
    const b2bTerms = ['enterprise', 'solutions', 'business', 'corporate', 'schedule demo', 'book a call', 'services', 'agency', 'platform', 'saas'];
    const b2cTerms = ['shop', 'cart', 'checkout', 'store', 'consumer', 'lifestyle', 'personal', 'home', 'fashion', 'buy now'];

    let b2bScore = 0;
    let b2cScore = 0;

    b2bTerms.forEach(t => { if (combined.includes(t)) b2bScore++; });
    b2cTerms.forEach(t => { if (combined.includes(t)) b2cScore++; });

    const businessType = b2bScore >= b2cScore ? 'B2B' : 'B2C';

    // Primary Goal
    let goal = 'Awareness';
    if (combined.includes('buy') || combined.includes('shop') || combined.includes('cart') || combined.includes('order')) {
        goal = 'Sales';
    } else if (combined.includes('demo') || combined.includes('contact') || combined.includes('quote') || combined.includes('start trial')) {
        goal = 'Leads';
    } else if (combined.includes('subscribe') || combined.includes('join') || combined.includes('community')) {
        goal = 'Engagement';
    }

    return {
        type: businessType,
        primaryGoal: goal
    };
}

/**
 * Extract visual identity (colors)
 */
function extractVisualIdentity($, html) {
    const colors = new Set();

    // Extract from inline styles
    $('[style]').each((i, elem) => {
        const style = $(elem).attr('style');
        const colorMatches = style?.match(/#[0-9A-Fa-f]{6}|rgb\([^)]+\)/g);
        if (colorMatches) {
            colorMatches.forEach(color => colors.add(color));
        }
    });

    // Extract from CSS
    const styleContent = $('style').text();
    const cssColors = styleContent.match(/#[0-9A-Fa-f]{6}/g);
    if (cssColors) {
        cssColors.forEach(color => colors.add(color));
    }

    const colorArray = Array.from(colors).slice(0, 8);

    return {
        primaryColors: colorArray.slice(0, 3),
        secondaryColors: colorArray.slice(3, 6),
    };
}

/**
 * Extract social proof (testimonials, case studies)
 */
function extractSocialProof($) {
    const socialProof = [];

    // Look for testimonial sections
    $('[class*="testimonial"], [class*="review"], [class*="quote"]').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 20 && text.length < 300 && socialProof.length < 3) {
            socialProof.push(text);
        }
    });

    // Look for blockquotes
    $('blockquote').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 20 && text.length < 300 && socialProof.length < 3) {
            socialProof.push(text);
        }
    });

    return socialProof;
}

/**
 * Extract competitive edge
 */
function extractCompetitiveEdge($) {
    const edges = [];

    // Look for "why us" type content
    $('[class*="why"], [class*="benefit"], [class*="advantage"]').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 15 && text.length < 150 && edges.length < 5) {
            edges.push(text);
        }
    });

    // Look for differentiator language
    const allText = $('body').text();
    const differentiatorPatterns = [
        /unlike ([^.!?]+)/gi,
        /only ([^.!?]+) that/gi,
        /first ([^.!?]+) to/gi,
    ];

    differentiatorPatterns.forEach(pattern => {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
            if (match[0] && edges.length < 5) {
                edges.push(match[0].trim().substring(0, 150));
            }
        }
    });

    return edges.slice(0, 3);
}
