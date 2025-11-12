// Simple backend-only Exa search integration
// No UI components, just enhances AI responses with real-time data when needed

interface ExaResult {
    url: string;
    title: string;
    text: string;
    publishedDate?: string;
    author?: string;
}

interface ExaResponse {
    results: ExaResult[];
}

class ExaSearchService {
    private static instance: ExaSearchService;
    private apiKey: string;
    private baseUrl: string;

    private useDirectApi: boolean;

    private getApiConfig(): { baseUrl: string; useDirectApi: boolean } {
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        
        if (isLocalhost) {
            // Use direct Exa API for localhost (no CORS issue)
            return {
                baseUrl: 'https://api.exa.ai/search',
                useDirectApi: true
            };
        } else {
            // Use proxy for production
            return {
                baseUrl: '/api/exa/search',
                useDirectApi: false
            };
        }
    }

    private constructor() {
        this.apiKey = import.meta.env.VITE_EXA_API_KEY || '';
        const config = this.getApiConfig();
        this.baseUrl = config.baseUrl;
        this.useDirectApi = config.useDirectApi;
    }

    static getInstance(): ExaSearchService {
        if (!ExaSearchService.instance) {
            ExaSearchService.instance = new ExaSearchService();
        }
        return ExaSearchService.instance;
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    // Use Gemini to intelligently detect if web search is needed (cost-effective)
    private async intelligentSearchDetection(message: string): Promise<boolean> {
        try {
            const detectionPrompt = `Does this user question require current, real-time information from the web to answer properly? 

Questions that DEFINITELY need web search:
- Latest product launches or company updates
- Current market data, trends, or statistics  
- Recent news, events, or developments
- Competitive analysis requiring current data
- Pricing or business model information that changes frequently
- Timeline of recent events
- "Latest", "recent", "current", "new" information requests

Answer with only "YES" or "NO".

User question: "${message}"

Answer:`;

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: detectionPrompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
                // console.log('🔍 Search detection result:', result, 'for query:', message);
                return result === 'YES';
            } else {
                console.error('🔍 Search detection API error:', response.status);
            }
        } catch (error) {
            console.error('Search detection failed:', error);
        }

        // Fallback to keyword detection
        return this.keywordBasedDetection(message);
    }

    // Fallback keyword-based detection
    private keywordBasedDetection(message: string): boolean {
        const lowerMessage = message.toLowerCase();

        // Comprehensive real-time indicators
        const realTimeIndicators = [
            // Time-based
            'latest', 'recent', 'current', 'new', 'updated', 'fresh', 'today', 'now', 'this year',
            '2024', '2025', 'recently', 'just released', 'just announced', 'breaking',

            // Market & Business
            'market trends', 'market analysis', 'competitive analysis', 'competitor analysis',
            'market research', 'industry trends', 'market size', 'market share', 'benchmarking',
            'pricing trends', 'pricing analysis', 'revenue trends', 'business model trends',

            // News & Events
            'news', 'announcement', 'launch', 'release', 'update', 'acquisition', 'merger',
            'funding', 'investment', 'ipo', 'partnership', 'deal', 'agreement',

            // Technology & Products
            'product launch', 'feature release', 'version', 'beta', 'alpha', 'rollout',
            'ai trends', 'tech trends', 'software trends', 'platform updates',

            // Research & Data
            'study', 'report', 'survey', 'research', 'statistics', 'data', 'insights',
            'analysis', 'findings', 'results', 'metrics', 'performance data',

            // Comparative & Lists
            'compare', 'comparison', 'vs', 'versus', 'alternatives', 'options',
            'list of', 'top', 'best', 'leading', 'popular', 'trending',

            // Company-specific
            'google', 'apple', 'microsoft', 'amazon', 'meta', 'netflix', 'spotify',
            'uber', 'airbnb', 'slack', 'zoom', 'figma', 'notion', 'stripe', 'shopify',
            'openai', 'anthropic', 'claude', 'chatgpt', 'gemini'
        ];

        return realTimeIndicators.some(indicator => lowerMessage.includes(indicator));
    }

    // Main search detection method (simple and reliable)
    shouldSearch(message: string): boolean {
        if (!this.isAvailable()) return false;

        // Use reliable keyword-based detection that was working before
        return this.keywordBasedDetection(message);
    }

    // Use Gemini to optimize search query (cost-effective)
    private async optimizeSearchQuery(userQuery: string): Promise<string> {
        try {
            const optimizationPrompt = `Convert this user question into the perfect web search query for finding current, accurate information. Focus on key terms and recent timeframes. Return ONLY the optimized search query, nothing else.

User question: "${userQuery}"

Optimized search query:`;

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: optimizationPrompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const optimizedQuery = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                // console.log('🔍 Query optimization result:', optimizedQuery || '(fallback)');
                return optimizedQuery || userQuery.slice(0, 200);
            } else {
                console.error('🔍 Query optimization API error:', response.status);
            }
        } catch (error) {
            console.error('🔍 Query optimization failed:', error);
        }

        return userQuery.slice(0, 200);
    }

    // Enhanced search with 25 results for comprehensive coverage
    async search(query: string): Promise<string> {
        // console.log('🔍 Search method called with query:', query);

        if (!this.isAvailable()) {
            // console.log('🔍 Search not available - no API key');
            return '';
        }

        try {
            // console.log('🔍 Starting web search process...');
            // Use Gemini to optimize the search query
            const optimizedQuery = await this.optimizeSearchQuery(query);
            // console.log('🔍 Optimized query:', optimizedQuery);

            // Prepare headers based on environment
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add API key for direct Exa API calls (localhost)
            if (this.useDirectApi) {
                headers['x-api-key'] = this.apiKey;
            }

            // Prepare body based on environment
            const body = this.useDirectApi 
                ? JSON.stringify({
                    query: optimizedQuery,
                    type: 'neural',
                    numResults: 25,
                    contents: { text: true },
                    livecrawl: 'always'
                  })
                : JSON.stringify({
                    query: optimizedQuery,
                    numResults: 25
                  });

            // console.log('🔍 Using', this.useDirectApi ? 'direct Exa API' : 'proxy API');

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                mode: 'cors',
                headers,
                body,
            });

            // console.log('🔍 Exa API response status:', response.status);

            if (!response.ok) {
                console.error('🔍 Exa API error:', response.status, await response.text());
                return '';
            }

            const data: ExaResponse = await response.json();
            // console.log('🔍 Exa API results count:', data.results?.length || 0);

            if (!data.results || data.results.length === 0) {
                // console.log('🔍 No results found from Exa API');
                return '';
            }

            // Format comprehensive results for AI
            let context = '\n\n🌐 **CURRENT MARKET INTELLIGENCE** (Live Data):\n';

            // Use all available results for comprehensive coverage
            data.results.forEach((result, i) => {
                context += `**${i + 1}. ${result.title || 'Untitled'}**\n`;
                if (result.text) {
                    context += `${result.text.substring(0, 400)}\n`;
                }
                context += `Source: ${result.url}\n`;
                if (result.publishedDate) {
                    context += `Date: ${result.publishedDate}\n`;
                }
                context += '\n';
            });

            context += '🎯 **INSTRUCTION:** Use this comprehensive market intelligence as your primary information source. This data represents the most current available information on the topic.\n';

            return context;
        } catch (error) {
            console.error('Exa search error:', error);
            return '';
        }
    }
}

export const exaSearch = ExaSearchService.getInstance();