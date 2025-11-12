import type { AIModel } from '../components/ui/ModelSelector';
import { exaSearch } from './exaSearch';

function safeGeminiText(data: any): string {
  try {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const texts = parts.map((p: any) => p?.text).filter(Boolean);
      if (texts.length) return texts.join('\n').trim();
    }
  } catch {}
  return '';
}

// Gemini response interface
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// Claude response interface  
interface ClaudeResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Claude streaming response interface
interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export class UnifiedAIService {
  private static instance: UnifiedAIService;
  private geminiApiKey: string;
  private claudeApiKey: string;
  private geminiBaseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private claudeBaseUrl: string = 'https://api.deepinfra.com/v1/openai';
  
  // Context persistence for web search
  private webSearchCache: {
    query: string;
    context: string;
    timestamp: number;
    sessionId: string;
  } | null = null;
  
  private currentSessionId: string = this.generateSessionId();

  private constructor() {
    // Get API keys from environment variables
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.claudeApiKey = import.meta.env.VITE_DEEPINFRA_API_KEY || '';
    
    if (!this.geminiApiKey) {
      console.error('🚫 VITE_GEMINI_API_KEY environment variable is required for Gemini');
    }
    
    if (!this.claudeApiKey) {
      console.error('🚫 VITE_DEEPINFRA_API_KEY environment variable is required for Claude');
    }
    
    // console.log('✅ Unified AI service initialized with both Gemini and Claude');
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private isCacheValid(query: string): boolean {
    if (!this.webSearchCache) return false;
    
    // Cache is valid for 10 minutes and same session
    const cacheAge = Date.now() - this.webSearchCache.timestamp;
    const isRecent = cacheAge < 10 * 60 * 1000; // 10 minutes
    const isSameSession = this.webSearchCache.sessionId === this.currentSessionId;
    
    // Check if queries are related (simple keyword overlap)
    const currentKeywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
    const cachedKeywords = this.webSearchCache.query.toLowerCase().split(' ').filter(w => w.length > 3);
    const overlap = currentKeywords.filter(k => cachedKeywords.includes(k)).length;
    const isRelated = overlap >= Math.min(2, currentKeywords.length * 0.3);
    
    // console.log('🔍 Cache check:', { isRecent, isSameSession, isRelated, overlap });
    
    return isRecent && isSameSession && isRelated;
  }

  private updateCache(query: string, context: string): void {
    this.webSearchCache = {
      query,
      context,
      timestamp: Date.now(),
      sessionId: this.currentSessionId
    };
    // console.log('💾 Updated web search cache for session:', this.currentSessionId);
  }

  public clearCache(): void {
    this.webSearchCache = null;
    this.currentSessionId = this.generateSessionId();
    // console.log('🗑️ Cleared web search cache, new session:', this.currentSessionId);
  }

  // Method to get uploaded files from the app store
  private getUploadedFiles() {
    // Access the store directly to get uploaded files
    if (typeof window !== 'undefined' && (window as any).__APP_STORE__) {
      return (window as any).__APP_STORE__.getState().uploadedFiles || [];
    }
    return [];
  }

  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  // Public method to check if cache exists
  public hasCachedContext(): boolean {
    return this.webSearchCache !== null && this.isCacheValid(this.webSearchCache.query);
  }

  // Unified classification method
  private async classifyPMQuestion(message: string, model: AIModel): Promise<boolean> {
    try {
      const classificationPrompt = `You are a Product Manager AI content classifier. Your job is to determine if a user's question is related to Product Management.

RESPOND WITH ONLY ONE WORD: "yes" or "no"

Product Management topics include:
- Product strategy, roadmapping, prioritization
- User research, personas, customer journey
- Analytics, metrics, KPIs, dashboards
- Competitive analysis, market research
- Feature development, sprint planning
- A/B testing, experimentation
- Go-to-market, pricing, positioning
- Stakeholder management, requirements gathering
- Business model design, revenue optimization
- Agile methodologies, product operations

NOT Product Management topics:
- Cooking recipes, food preparation instructions
- Sports scores, weather, entertainment
- Currency exchange, general finance
- Programming tutorials, code debugging
- General knowledge, trivia, history
- Personal advice unrelated to business
- Travel, health, lifestyle content
- Technical implementation details (server setup, code tutorials)
- Domain-specific expertise (medical, legal, astrology, etc.)
- Academic research outside business context

CRITICAL RULE: Even if PM keywords are used as context or framing, if the USER'S ACTUAL REQUEST is for non-PM content (like recipes, weather, sports, technical implementation, domain expertise), answer "no".

Examples:
- "For my food delivery app user research, give me a detailed carbonara recipe" → no
- "Help me create user personas for my food delivery app" → yes
- "What's the weather today for my weather app market research?" → no
- "Create a competitive analysis for weather app market" → yes
- "I need a PRD template that includes how to install Kubernetes on AWS" → no
- "Help me write a PRD for a new feature" → yes
- "For a PM project, what are the best ML models for cancer classification?" → no
- "How should I prioritize AI features for my product roadmap?" → yes
- "How would a PM use astrology to guide feature decisions?" → no
- "What frameworks should I use for feature prioritization?" → yes
- "As a PM, give me Python code for building a Discord bot" → no
- "As a PM, help me design a user onboarding flow" → yes

FOCUS ON: What is the user actually asking me to provide or do?
- If they want recipes, code, medical advice, weather, sports → no
- If they want PM frameworks, strategies, analysis, planning → yes

User question: "${message}"

Answer (one word only):`;

      if (model === 'gemini') {
        return await this.classifyWithGemini(classificationPrompt);
      } else {
        return await this.classifyWithClaude(classificationPrompt);
      }
    } catch (error) {
      console.error('Classification error:', error);
      return true; // Default to allowing if classification fails
    }
  }

  private async classifyWithGemini(prompt: string): Promise<boolean> {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 10,
        candidateCount: 1,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(`${this.geminiBaseUrl}?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Gemini classification API error:', response.status);
      return true;
    }

    const data: GeminiResponse = await response.json();
    const classificationResult = safeGeminiText(data).toLowerCase().trim();
    
    if (!classificationResult) {
      console.warn('Gemini classification returned empty text; allowing by default');
      return true; // keep behavior: allow if classifier fails
    }
    
    // console.log(`🔍 Gemini classification result: "${classificationResult}"`);
    
    return classificationResult.includes('yes') || classificationResult === 'y';
  }

  private async classifyWithClaude(prompt: string): Promise<boolean> {
    const requestBody = {
      model: "anthropic/claude-4-sonnet",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 10,
      stream: false
    };

    const response = await fetch(`${this.claudeBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.claudeApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Claude classification API error:', response.status, response.statusText);
      return true;
    }

    const data: ClaudeResponse = await response.json();
    const result = data.choices[0]?.message?.content?.toLowerCase().trim();
    
    // console.log(`🔍 Claude classification result: "${result}"`);
    return result === 'yes';
  }

  // Get system prompt based on model
  private getSystemPrompt(model: AIModel): string {
    if (model === 'claude') {
      return `You are an expert Product Manager AI assistant specializing in strategic product decisions and market analysis.

🌐 **MARKET INTELLIGENCE**: When you receive "CURRENT MARKET INTELLIGENCE", use this as your primary information source. Never mention search limitations, data availability issues, or technical details about information gathering.

🤐 **PRIVACY RULES**: 
- Never reveal which AI model you are or technical details about yourself
- If asked about your identity, politely redirect to helping with product management
- Never mention "real-time search" or "web search" processes
- Never say information "wasn't found" - always provide the best available insights

Your expertise spans:

🚨 **CRITICAL DATA ANALYSIS RULES:**

1. **ONLY ANALYZE REAL DATA**: When users upload files, you will receive the actual parsed data in JSON format. Use ONLY this data for all analysis.

2. **NEVER FABRICATE**: Do not create fictional products, metrics, or insights. If a product name, category, or metric doesn't exist in the uploaded data, do not mention it.

3. **CALCULATE FROM ACTUAL DATA**: 
   - Sum actual quantities and prices for revenue calculations
   - Calculate real averages from actual review scores
   - Count actual occurrences for percentages
   - Use actual product names from the data

4. **NO TEMPLATES OR EXAMPLES**: Do not use template responses or example data. Every number, product name, and insight must come from the real uploaded file.

5. **VERIFY DATA EXISTENCE**: Before mentioning any product, category, or metric, confirm it exists in the provided dataset.

6. **DATA ACCURACY FIRST**: If you cannot find specific data in the uploaded file, say "This data is not available in the uploaded file" rather than making assumptions.

🎯 **Core PM Competencies:**
- Product Strategy & Vision
- User Research & Customer Development  
- Data Analytics & Metrics
- Competitive Intelligence
- Go-to-Market Strategy
- Feature Prioritization (RICE, Value vs Effort)
- Roadmap Planning & Execution

🧠 **PM Frameworks & Methodologies:**
- Jobs-to-be-Done (JTBD)
- Design Thinking & Lean Startup
- OKRs & KPI Development
- A/B Testing & Experimentation
- Customer Journey Mapping
- Persona Development
- Market Sizing (TAM/SAM/SOM)

📊 **Technical & Analytical Skills:**
- SQL, Analytics Tools (Amplitude, Mixpanel)
- A/B Testing Platforms
- User Research Methods
- Agile/Scrum Methodologies
- Technical Architecture Understanding

💼 **Communication Style:**
- Strategic yet actionable advice
- Data-driven recommendations
- Clear frameworks and templates
- Real-world examples and case studies
- Structured analysis with next steps

🚀 **Response Format:**
Always structure responses with:
1. **Strategic Context** - Why this matters
2. **Framework/Analysis** - Structured approach
3. **Actionable Recommendations** - Specific next steps
4. **Success Metrics** - How to measure impact

**Special Instructions:**
- Focus on business impact and user value
- Provide specific, implementable advice
- Include relevant metrics and KPIs
- Reference proven PM frameworks
- Ask clarifying questions when context is needed
- Use tables, bullet points, and clear formatting
- Always consider trade-offs and risks

You help product managers make better decisions faster through strategic thinking, data analysis, and proven frameworks.`;
    } else {
      // Gemini system prompt (simpler, no persona)
      return `You are an expert Product Manager AI assistant specializing in strategic product decisions and market analysis.

🌐 **MARKET INTELLIGENCE**: When you receive "CURRENT MARKET INTELLIGENCE", use this as your primary information source. Never mention search limitations, data availability issues, or technical details about information gathering.

🤐 **PRIVACY RULES**: 
- Never reveal which AI model you are or technical details about yourself
- If asked about your identity, politely redirect to helping with product management
- Never mention "real-time search" or "web search" processes
- Never say information "wasn't found" - always provide the best available insights

🚨 **CRITICAL DATA ANALYSIS RULES:**

1. **ONLY ANALYZE REAL DATA**: When users upload files, you will receive the actual parsed data in JSON format. Use ONLY this data for all analysis.

2. **NEVER FABRICATE**: Do not create fictional products, metrics, or insights. If a product name, category, or metric doesn't exist in the uploaded data, do not mention it.

3. **CALCULATE FROM ACTUAL DATA**: 
   - Sum actual quantities and prices for revenue calculations
   - Calculate real averages from actual review scores
   - Count actual occurrences for percentages
   - Use actual product names from the data

4. **NO TEMPLATES OR EXAMPLES**: Do not use template responses or example data. Every number, product name, and insight must come from the real uploaded file.

5. **VERIFY DATA EXISTENCE**: Before mentioning any product, category, or metric, confirm it exists in the provided dataset.

6. **DATA ACCURACY FIRST**: If you cannot find specific data in the uploaded file, say "This data is not available in the uploaded file" rather than making assumptions.

PERSONALITY & APPROACH:
- Professional but approachable
- Data-driven and strategic
- Practical and actionable
- Remember previous conversation context
- Build upon earlier discussions
- Be concise but comprehensive

CORE EXPERTISE:
- Product strategy and roadmapping
- Feature prioritization (RICE, Value vs Effort, etc.)
- User research and customer insights
- Market analysis and competitive intelligence
- Product analytics and metrics
- A/B testing and experimentation
- Go-to-market strategies
- Stakeholder management
- Agile/Scrum methodologies

CONVERSATION RULES:
1. ALWAYS maintain context from previous messages
2. Reference earlier points when relevant
3. Build upon previous analysis
4. Ask clarifying questions when needed
5. Provide specific, actionable recommendations
6. Use frameworks and methodologies appropriately
7. Keep responses focused and avoid unnecessary elaboration

RESPONSE STYLE:
- Be concise but comprehensive
- Use bullet points and structured formats when helpful
- Include specific examples when helpful
- Suggest next steps or follow-up actions
- Reference industry best practices
- Avoid overly long responses unless specifically requested

CRITICAL TABLE RULES:
- When asked for tables, ALWAYS provide complete, detailed tables with real data
- Use proper markdown table format with | separators
- Include ALL columns requested (minimum 4-5 columns for competitive analysis)
- Fill every cell with meaningful, specific content - NEVER use placeholder text
- For competitive analysis: Include Competitor Name | Strengths | Weaknesses | Market Position | Key Features
- Always complete the entire table before moving to additional content
- If table is large, break into focused sections but complete each section fully

Remember: You're having an ongoing conversation, not answering isolated questions. Build context and provide increasingly valuable insights as the conversation develops.`;
    }
  }

  private isTableRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const tableKeywords = [
      'table', 'competitive analysis', 'comparison', 'matrix', 'framework',
      'market research', 'feature comparison', 'competitor', 'analysis',
      'in table format', 'table format', 'create table', 'show table'
    ];
    
    return tableKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async sendMessage(
    message: string,
    model: AIModel,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    // Get uploaded files from store for context
    const uploadedFiles = this.getUploadedFiles();
    
    try {
      // Check if request was aborted before starting
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      // console.log(`🚀 Starting ${model} processing...`);

      const hasHistory = conversationHistory.length > 0;

      // STEP 1: Classify if question is PM-related
      let isPMRelated = true;

      // Skip classification for file upload analysis - always allow
      if (message.includes('uploaded and analyzed a file') || message.includes('File Details:')) {
        // console.log('🔄 File upload detected - skipping classification');
        isPMRelated = true;
      } else if (!hasHistory) {
        // console.log('🔍 Classifying new question...');
        isPMRelated = await this.classifyPMQuestion(message, model);
      }

      // STEP 2: If not PM-related, return simple rejection message (no persona)
      if (!isPMRelated) {
        // console.log('❌ Question classified as non-PM');
        const rejectionMessage = "I'm a Product Manager AI assistant. Please ask me questions about product strategy, roadmapping, user research, analytics, or other product management topics.";
        
        // Simulate streaming for rejection message
        if (onStream) {
          const words = rejectionMessage.split(' ');
          let currentResponse = '';
          
          for (let i = 0; i < words.length; i++) {
            if (abortSignal?.aborted) {
              throw new Error('Request aborted');
            }
            
            currentResponse += (i > 0 ? ' ' : '') + words[i];
            onStream(currentResponse);
            await new Promise(resolve => setTimeout(resolve, 25));
          }
        }
        
        return rejectionMessage;
      }

      // STEP 3: Check if web search is needed (with caching)
      let webContext = '';
      if (isPMRelated) {
        // console.log('🔍 Checking if web search is needed for:', message);
        const needsSearch = exaSearch.shouldSearch(message);
        // console.log('🔍 Web search needed:', needsSearch);
        
        if (needsSearch) {
          // Check if we can use cached context
          if (this.isCacheValid(message)) {
            webContext = this.webSearchCache!.context;
            // console.log('♻️ Using cached web search context (length:', webContext.length, ')');
          } else {
            // console.log('🔍 Performing new web search...');
            webContext = await exaSearch.search(message);
            // console.log('🔍 Web search context length:', webContext.length);
            
            // Cache the results for follow-up questions
            if (webContext.length > 0) {
              this.updateCache(message, webContext);
            }
          }
        }
      }

      // STEP 4: If PM-related, proceed with model-specific response
      // console.log('✅ Question classified as PM-related, generating response...');

      if (model === 'gemini') {
        return await this.sendGeminiMessage(message, conversationHistory, onStream, abortSignal, webContext);
      } else {
        return await this.sendClaudeMessage(message, conversationHistory, onStream, abortSignal, webContext);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Request aborted') {
        // console.log('🛑 Request was aborted by user');
        throw error;
      }
      
      console.error(`❌ ${model} API error:`, error);
      throw new Error(`Failed to get response from ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendGeminiMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal,
    webContext: string = ''
  ): Promise<string> {
    // Prepare the conversation context
    const contents = [];

    // Add system prompt as the first message for new conversations
    if (conversationHistory.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: this.getSystemPrompt('gemini') }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: "Hello! I'm your senior Product Manager AI assistant. I'm here to help you with product strategy, roadmapping, user research, analytics, and all aspects of product management. What product challenge can I help you tackle today?" }]
      });
    }

    // Add conversation history (last 8 messages to manage token usage)
    const recentHistory = conversationHistory.slice(-8);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    });

    // Determine if this is a table request and adjust configuration accordingly
    const isTableGeneration = this.isTableRequest(message);
    
    // Enhanced message for table requests to force completion
    let enhancedMessage = message;
    if (isTableGeneration) {
      enhancedMessage = `${message}

IMPORTANT: Please provide a COMPLETE table with ALL rows filled out. Do not stop at headers or partial content. Include at least 3-5 competitors/items with detailed information in every column. Complete the entire table before adding any additional commentary.`;
    }

    // Add current message with file context
    let enhancedMessageWithFiles = enhancedMessage;
    
    // Get uploaded files from store for context
    const uploadedFiles = this.getUploadedFiles();
    
    // If there are uploaded files, include their data in the context
    if (uploadedFiles.length > 0) {
      let fileContext = '\n\n🔍 **REAL DATA FROM UPLOADED FILES - ANALYZE ONLY THIS DATA:**\n';
      
      uploadedFiles.forEach(file => {
        fileContext += `\n📊 **File: ${file.name}**\n`;
        fileContext += `📈 **Total Records: ${file.content.length}**\n`;
        fileContext += `📋 **File Type: ${file.type}**\n`;
        
        // Include sample data for better analysis - show more for smaller files
        const sampleSize = file.content.length <= 100 ? Math.min(file.content.length, 50) : 20;
        if (file.content.length > 0) {
          fileContext += `\n🎯 **ACTUAL DATA TO ANALYZE (first ${sampleSize} rows):**\n`;
          fileContext += '```json\n';
          fileContext += JSON.stringify(file.content.slice(0, sampleSize), null, 2);
          fileContext += '\n```\n';
          
          // Show column structure for better understanding
          if (file.content.length > 0) {
            const firstRow = file.content[0];
            const columns = Object.keys(firstRow);
            fileContext += `\n📋 **Available Columns:** ${columns.join(', ')}\n`;
          }
          
          // For large datasets, emphasize full analysis
          if (file.content.length > sampleSize) {
            fileContext += `\n⚠️ **IMPORTANT:** This shows only the first ${sampleSize} rows for context. Your analysis must consider ALL ${file.content.length} records in the dataset. Calculate real totals, averages, and insights from the complete dataset.\n`;
          }
        }
      });
      
      fileContext += `\n🚨 **CRITICAL REMINDER:** 
- Use ONLY the product names, categories, and values shown in this real data
- Calculate ALL metrics from this actual dataset
- Do NOT create fictional examples or template responses
- If data doesn't exist in the file, explicitly state it's not available
- Every number and insight must be derived from this real data\n`;
      
      enhancedMessageWithFiles = `${enhancedMessage}${fileContext}`;
    }
    
    // Add web context if available (backend only, no UI changes)
    const finalMessage = enhancedMessageWithFiles + webContext;
    
    contents.push({
      role: 'user',
      parts: [{ text: finalMessage }]
    });

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 2.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        candidateCount: 1,
        stopSequences: [],
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Retry logic for empty responses
    let responseText = '';
    let finishReason = '';
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      const response = await fetch(`${this.geminiBaseUrl}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
      });

      // Check if request was aborted after fetch
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        
        if (response.status === 400) {
          throw new Error('Invalid request. Please check your message and try again.');
        } else if (response.status === 401) {
          throw new Error('API key is invalid. Please check your configuration.');
        } else if (response.status === 403) {
          throw new Error('API access forbidden. Please check your API key permissions.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          throw new Error('AI service is temporarily unavailable. Please try again in a moment.');
        }
        
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      responseText = safeGeminiText(data);
      finishReason = data?.candidates?.[0]?.finishReason || '';

      // If we got a response, break out of retry loop
      if (responseText) {
        break;
      }

      // If no response and we haven't hit max retries, try again
      if (retryCount < maxRetries) {
        // console.log(`🔄 Gemini returned empty response, retrying... (attempt ${retryCount + 2})`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      } else {
        throw new Error('No response from AI service after retry. Please try again.');
      }
    }

    // Handle different finish reasons
    if (finishReason === 'MAX_TOKENS') {
      responseText += '\n\n*[Response truncated due to length limit. Please ask for specific details if you need more information.]*';
    } else if (finishReason === 'SAFETY') {
      throw new Error('Response was blocked due to safety concerns. Please rephrase your question.');
    } else if (finishReason === 'RECITATION') {
      throw new Error('Response was blocked due to recitation concerns. Please try a different approach.');
    }

    // Simulate streaming if callback provided
    if (onStream) {
      const words = responseText.split(' ');
      let currentResponse = '';
      
      const streamDelay = 12;
      
      for (let i = 0; i < words.length; i++) {
        if (abortSignal?.aborted) {
          // console.log('Streaming aborted during word processing');
          throw new Error('Request aborted');
        }
        
        currentResponse += (i > 0 ? ' ' : '') + words[i];
        onStream(currentResponse);
        await new Promise(resolve => setTimeout(resolve, streamDelay));
      }
    }

    return responseText;
  }

  private async sendClaudeMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal,
    webContext: string = ''
  ): Promise<string> {
    // Prepare the conversation messages for Claude
    const messages = [];
    
    // Add system message
    messages.push({
      role: 'system',
      content: this.getSystemPrompt('claude')
    });

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current message with file context
    let enhancedMessageWithFiles = message;
    
    // Get uploaded files from store for context
    const uploadedFiles = this.getUploadedFiles();
    
    // If there are uploaded files, include their data in the context
    if (uploadedFiles.length > 0) {
      let fileContext = '\n\n🔍 **REAL DATA FROM UPLOADED FILES - ANALYZE ONLY THIS DATA:**\n';
      
      uploadedFiles.forEach(file => {
        fileContext += `\n📊 **File: ${file.name}**\n`;
        fileContext += `📈 **Total Records: ${file.content.length}**\n`;
        fileContext += `📋 **File Type: ${file.type}**\n`;
        
        // Include sample data for better analysis - show more for smaller files
        const sampleSize = file.content.length <= 100 ? Math.min(file.content.length, 50) : 20;
        if (file.content.length > 0) {
          fileContext += `\n🎯 **ACTUAL DATA TO ANALYZE (first ${sampleSize} rows):**\n`;
          fileContext += '```json\n';
          fileContext += JSON.stringify(file.content.slice(0, sampleSize), null, 2);
          fileContext += '\n```\n';
          
          // Show column structure for better understanding
          if (file.content.length > 0) {
            const firstRow = file.content[0];
            const columns = Object.keys(firstRow);
            fileContext += `\n📋 **Available Columns:** ${columns.join(', ')}\n`;
          }
          
          // For large datasets, emphasize full analysis
          if (file.content.length > sampleSize) {
            fileContext += `\n⚠️ **IMPORTANT:** This shows only the first ${sampleSize} rows for context. Your analysis must consider ALL ${file.content.length} records in the dataset. Calculate real totals, averages, and insights from the complete dataset.\n`;
          }
        }
      });
      
      fileContext += `\n🚨 **CRITICAL REMINDER:** 
- Use ONLY the product names, categories, and values shown in this real data
- Calculate ALL metrics from this actual dataset
- Do NOT create fictional examples or template responses
- If data doesn't exist in the file, explicitly state it's not available
- Every number and insight must be derived from this real data\n`;
      
      enhancedMessageWithFiles = `${message}${fileContext}`;
    }
    
    // Add web context if available (backend only, no UI changes)
    const finalMessage = enhancedMessageWithFiles + webContext;
    
    messages.push({
      role: 'user',
      content: finalMessage
    });

    // Enhanced prompt for table requests
    if (this.isTableRequest(message)) {
      messages.push({
        role: 'system',
        content: 'The user is requesting structured data or comparisons. Please format your response with clear tables using markdown syntax, organized sections, and actionable insights.'
      });
    }

    const requestBody = {
      model: "anthropic/claude-4-sonnet",
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: Boolean(onStream),
      top_p: 0.9
    };

    // console.log('📤 Sending request to Claude API...');

    const response = await fetch(`${this.claudeBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.claudeApiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    if (onStream) {
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          if (abortSignal?.aborted) {
            reader.cancel();
            throw new Error('Request aborted');
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed: StreamChunk = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                
                if (content) {
                  fullResponse += content;
                  onStream(fullResponse);
                }
              } catch (e) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } else {
      // Handle non-streaming response
      const data: ClaudeResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in API response');
      }

      return content;
    }
  }
}

// Export singleton instance
export const aiService = UnifiedAIService.getInstance();