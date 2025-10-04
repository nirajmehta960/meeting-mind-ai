import type { AIModel } from "../types/ai";

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

function safeGeminiText(data: any): string {
  try {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const texts = parts.map((p: any) => p?.text).filter(Boolean);
      if (texts.length) return texts.join("\n").trim();
    }
  } catch {}
  return "";
}

export class MeetingAIService {
  private static instance: MeetingAIService;
  private geminiApiKey: string;
  private claudeApiKey: string;
  private geminiBaseUrl: string =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  private claudeBaseUrl: string = "https://api.deepinfra.com/v1/openai";

  private constructor() {
    // Get API keys from environment variables
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    this.claudeApiKey = import.meta.env.VITE_DEEPINFRA_API_KEY || "";

    if (!this.geminiApiKey) {
      console.error(
        "🚫 VITE_GEMINI_API_KEY environment variable is required for Gemini"
      );
    }

    if (!this.claudeApiKey) {
      console.error(
        "🚫 VITE_DEEPINFRA_API_KEY environment variable is required for Claude"
      );
    }
  }

  static getInstance(): MeetingAIService {
    if (!MeetingAIService.instance) {
      MeetingAIService.instance = new MeetingAIService();
    }
    return MeetingAIService.instance;
  }

  // Get system prompt based on model
  private getSystemPrompt(model: AIModel): string {
    if (model === "claude") {
      return `You are an expert Meeting Assistant AI specialized in helping product managers and teams make the most of their meetings.

🎯 **CORE EXPERTISE:**
- Meeting summaries and key insights extraction
- Action item identification and prioritization  
- Stakeholder communication and email drafting
- Follow-up planning and task management
- Meeting effectiveness analysis
- Decision tracking and accountability

📝 **MEETING ANALYSIS CAPABILITIES:**
- Summarize meeting transcripts with key decisions and outcomes
- Extract specific action items with owners and deadlines
- Identify follow-up tasks and dependencies
- Generate stakeholder update emails
- Create meeting minutes in various formats
- Analyze meeting patterns and effectiveness

💼 **COMMUNICATION SPECIALIST:**
- Draft professional stakeholder emails
- Create executive summaries
- Format meeting notes for different audiences
- Generate follow-up reminders and check-ins
- Structure action item communications

🚀 **RESPONSE STYLE:**
- Clear, actionable, and professional
- Structured with headings and bullet points
- Focus on next steps and accountability
- Include specific deadlines and owners when possible
- Provide templates and frameworks for consistency

**Special Instructions:**
- Always focus on meeting-related productivity and outcomes
- Provide specific, implementable next steps
- Use clear formatting for action items and decisions
- Include relevant templates when helpful
- Ask clarifying questions when meeting context is unclear

You help teams turn meeting chaos into clear action and accountability.`;
    } else {
      // Gemini system prompt
      return `You are an expert Meeting Assistant AI specialized in helping product managers and teams make the most of their meetings.

CORE EXPERTISE:
- Meeting summaries and key insights extraction
- Action item identification and prioritization  
- Stakeholder communication and email drafting
- Follow-up planning and task management
- Meeting effectiveness analysis

MEETING ANALYSIS CAPABILITIES:
- Summarize meeting transcripts with key decisions and outcomes
- Extract specific action items with owners and deadlines
- Identify follow-up tasks and dependencies
- Generate stakeholder update emails
- Create meeting minutes in various formats

COMMUNICATION SPECIALIST:
- Draft professional stakeholder emails
- Create executive summaries
- Format meeting notes for different audiences
- Generate follow-up reminders and check-ins

RESPONSE STYLE:
- Clear, actionable, and professional
- Structured with headings and bullet points
- Focus on next steps and accountability
- Include specific deadlines and owners when possible

Always focus on meeting-related productivity and outcomes. Provide specific, implementable next steps with clear formatting for action items and decisions.`;
    }
  }

  async sendMessage(
    message: string,
    model: AIModel,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    try {
      // Check if request was aborted before starting
      if (abortSignal?.aborted) {
        throw new Error("Request aborted");
      }

      if (model === "gemini") {
        return await this.sendGeminiMessage(
          message,
          conversationHistory,
          onStream,
          abortSignal
        );
      } else {
        return await this.sendClaudeMessage(
          message,
          conversationHistory,
          onStream,
          abortSignal
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Request aborted") {
        throw error;
      }

      console.error(`❌ ${model} API error:`, error);
      throw new Error(
        `Failed to get response from ${model}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async sendGeminiMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    // Prepare the conversation context
    const contents = [];

    // Add system prompt as the first message for new conversations
    if (conversationHistory.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: this.getSystemPrompt("gemini") }],
      });
      contents.push({
        role: "model",
        parts: [
          {
            text: "Hello! I'm your Meeting Assistant AI. I specialize in helping you summarize meetings, extract action items, draft stakeholder emails, and manage follow-ups. What meeting would you like me to help you with today?",
          },
        ],
      });
    }

    // Add conversation history (last 8 messages to manage token usage)
    const recentHistory = conversationHistory.slice(-8);
    recentHistory.forEach((msg) => {
      if (msg.role === "user") {
        contents.push({
          role: "user",
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === "assistant") {
        contents.push({
          role: "model",
          parts: [{ text: msg.content }],
        });
      }
    });

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        candidateCount: 1,
        stopSequences: [],
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    const response = await fetch(
      `${this.geminiBaseUrl}?key=${this.geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
      }
    );

    // Check if request was aborted after fetch
    if (abortSignal?.aborted) {
      throw new Error("Request aborted");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);

      if (response.status === 400) {
        throw new Error(
          "Invalid request. Please check your message and try again."
        );
      } else if (response.status === 401) {
        throw new Error("API key is invalid. Please check your configuration.");
      } else if (response.status === 403) {
        throw new Error(
          "API access forbidden. Please check your API key permissions."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      } else if (response.status >= 500) {
        throw new Error(
          "AI service is temporarily unavailable. Please try again in a moment."
        );
      }

      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    const responseText = safeGeminiText(data);
    const finishReason = data?.candidates?.[0]?.finishReason || "";

    // Handle different finish reasons
    if (finishReason === "MAX_TOKENS") {
      responseText +=
        "\n\n*[Response truncated due to length limit. Please ask for specific details if you need more information.]*";
    } else if (finishReason === "SAFETY") {
      throw new Error(
        "Response was blocked due to safety concerns. Please rephrase your question."
      );
    } else if (finishReason === "RECITATION") {
      throw new Error(
        "Response was blocked due to recitation concerns. Please try a different approach."
      );
    }

    // Simulate streaming if callback provided
    if (onStream) {
      const words = responseText.split(" ");
      let currentResponse = "";

      const streamDelay = 15;

      for (let i = 0; i < words.length; i++) {
        if (abortSignal?.aborted) {
          throw new Error("Request aborted");
        }

        currentResponse += (i > 0 ? " " : "") + words[i];
        onStream(currentResponse);
        await new Promise((resolve) => setTimeout(resolve, streamDelay));
      }
    }

    return responseText;
  }

  private async sendClaudeMessage(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    onStream?: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    // Prepare the conversation messages for Claude
    const messages = [];

    // Add system message
    messages.push({
      role: "system",
      content: this.getSystemPrompt("claude"),
    });

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    const requestBody = {
      model: "anthropic/claude-4-sonnet",
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: Boolean(onStream),
      top_p: 0.9,
    };

    const response = await fetch(`${this.claudeBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.claudeApiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    if (onStream) {
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";

      try {
        while (true) {
          if (abortSignal?.aborted) {
            reader.cancel();
            throw new Error("Request aborted");
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

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
        throw new Error("No content in API response");
      }

      return content;
    }
  }
}

// Export singleton instance
export const meetingAIService = MeetingAIService.getInstance();
