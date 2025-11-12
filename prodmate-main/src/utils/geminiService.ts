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

interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class ClaudeService {
  private static instance: ClaudeService;
  private apiKey: string;
  private baseUrl: string = 'https://api.deepinfra.com/v1/openai';

  // NEW METHOD: Classification filter using Claude itself
  private async classifyPMQuestion(message: string): Promise<boolean> {
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

      const requestBody = {
        model: "anthropic/claude-4-sonnet",
        messages: [
          {
            role: 'user',
            content: classificationPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10,
        stream: false
      };

      // console.log('🔍 Sending classification request to Claude...');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Classification API error:', response.status, response.statusText);
        return true; // Default to allowing if classification fails
      }

      const data: ClaudeResponse = await response.json();
      const result = data.choices[0]?.message?.content?.toLowerCase().trim();
      
      // console.log('📋 Classification result:', result);
      return result === 'yes';
    } catch (error) {
      console.error('Classification error:', error);
      return true; // Default to allowing if classification fails
    }
  }

  private constructor() {
    // Get API key from environment variable
    this.apiKey = import.meta.env.VITE_DEEPINFRA_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('🚫 VITE_DEEPINFRA_API_KEY environment variable is required');
      throw new Error('DeepInfra API key is required');
    }
    
    // console.log('✅ Claude service initialized with DeepInfra API');
  }

  static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService();
    }
    return ClaudeService.instance;
  }

  private getSystemPrompt(): string {
    return `You are a Senior Product Manager AI assistant with 10+ years of experience at leading tech companies like Google, Amazon, and successful startups. Your expertise spans:

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
  }

  private isTableRequest(message: string): boolean {
    const tableKeywords = [
      'table', 'matrix', 'comparison', 'compare', 'competitive analysis',
      'feature comparison', 'prioritization matrix', 'roadmap', 'timeline',
      'requirements', 'specifications', 'pros and cons', 'evaluation'
    ];
    
    return tableKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  async sendMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    try {
      // Check if request was aborted before starting
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      // console.log('🚀 Starting Claude classification process...');

      const hasHistory = conversationHistory.length > 0;

      // STEP 1: Classify if question is PM-related using Claude
      let isPMRelated = true;

      if (!hasHistory) {
        // console.log('🔍 Classifying new question...');
        isPMRelated = await this.classifyPMQuestion(message);
      }

      // STEP 2: If not PM-related, return rejection message
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

      // STEP 3: If PM-related, proceed with full response
      // console.log('✅ Question classified as PM-related, generating response...');

      // Prepare the conversation messages for Claude
      const messages = [];
      
      // Add system message
      messages.push({
        role: 'system',
        content: this.getSystemPrompt()
      });

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current message
      messages.push({
        role: 'user',
        content: message
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

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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
    } catch (error) {
      if (error instanceof Error && error.message === 'Request aborted') {
        // console.log('🛑 Request was aborted by user');
        throw error;
      }
      
      console.error('❌ Claude API error:', error);
      throw new Error(`Failed to get response from Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const geminiService = ClaudeService.getInstance();