import type { AIModel } from "@/types/ai";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ModelConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
}

class OpenRouterService {
  private static instance: OpenRouterService;
  private apiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1/chat/completions";
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  // Model configurations
  private readonly MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
    claude: {
      model: "anthropic/claude-3.5-sonnet",
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.9,
    },
    gemini: {
      model: "openai/gpt-4o-mini",
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  // System prompt for MeetingMind
  private readonly SYSTEM_PROMPT = `You are MeetingMind AI, an expert meeting analyst and product management assistant. Your role is to help users transform meeting transcripts and notes into actionable insights.

Your capabilities:
- Generate clear, concise meeting summaries highlighting key points
- Extract and organize action items with owners and deadlines
- Draft professional stakeholder emails based on meeting outcomes
- Identify key decisions and their context
- Create follow-up plans with next steps
- Analyze meeting effectiveness and suggest improvements

Output Guidelines:
- Use clear headers and bullet points for structure
- For action items: format as "• [Action] - Owner: [Name] - Due: [Date]"
- For summaries: include Key Points, Decisions Made, and Next Steps sections
- For emails: use professional tone with clear subject lines
- Be concise but comprehensive
- Highlight critical information
- Use markdown formatting for better readability

Always prioritize actionable insights over lengthy descriptions.`;

  private constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "⚠️ VITE_OPENROUTER_API_KEY environment variable is not set. AI features will not work."
      );
    }
  }

  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  /**
   * Send a message with streaming support
   */
  async sendMessage(
    messages: Message[],
    model: AIModel,
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error(
        "Invalid API key. Please check your OpenRouter configuration."
      );
    }

    // Check if already aborted
    if (signal?.aborted) {
      throw new Error("Request aborted");
    }

    const config = this.MODEL_CONFIGS[model];
    if (!config) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // Prepare messages with system prompt
    const requestMessages: Message[] = [
      {
        role: "system",
        content: this.SYSTEM_PROMPT,
      },
      ...messages,
    ];

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }

      try {
        await this.executeRequest(
          requestMessages,
          config,
          onChunk,
          signal,
          attempt
        );
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on abort or auth errors
        if (
          signal?.aborted ||
          lastError.message.includes("API key") ||
          lastError.message.includes("aborted")
        ) {
          throw lastError;
        }

        // Exponential backoff
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  /**
   * Execute the API request with streaming
   */
  private async executeRequest(
    messages: Message[],
    config: ModelConfig,
    onChunk: (text: string) => void,
    signal: AbortSignal | undefined,
    attempt: number
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.REQUEST_TIMEOUT);

    // Combine signals
    if (signal) {
      signal.addEventListener("abort", () => {
        controller.abort();
        clearTimeout(timeoutId);
      });
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "MeetingMind",
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if aborted
      if (signal?.aborted || controller.signal.aborted) {
        throw new Error("Request aborted");
      }

      if (!response.ok) {
        await this.handleErrorResponse(response, attempt);
      }

      // Handle streaming response
      await this.handleStreamResponse(response, onChunk, signal);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message.includes("aborted")) {
          throw new Error("Request aborted");
        }
        throw error;
      }
      throw new Error("Unknown error occurred");
    }
  }

  /**
   * Handle streaming response from OpenRouter
   */
  private async handleStreamResponse(
    response: Response,
    onChunk: (text: string) => void,
    signal: AbortSignal | undefined
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";

    try {
      while (true) {
        // Check if aborted
        if (signal?.aborted) {
          reader.cancel();
          throw new Error("Request aborted");
        }

        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (signal?.aborted) {
            reader.cancel();
            throw new Error("Request aborted");
          }

          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            // Skip empty data or [DONE]
            if (!data || data === "[DONE]") continue;

            try {
              const parsed: OpenRouterResponse = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                fullResponse += content;
                onChunk(fullResponse);
              }

              // Check for finish reason
              const finishReason = parsed.choices[0]?.finish_reason;
              if (finishReason === "length") {
                console.warn("Response truncated due to token limit");
              } else if (finishReason === "content_filter") {
                throw new Error(
                  "Response was filtered. Please rephrase your question."
                );
              }
            } catch (e) {
              // Skip invalid JSON (might be metadata or error)
              if (data.includes("error")) {
                try {
                  const errorData = JSON.parse(data);
                  throw new Error(
                    errorData.error?.message || "Error in API response"
                  );
                } catch {
                  // Ignore parse errors for error messages
                }
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(
    response: Response,
    attempt: number
  ): Promise<never> {
    let errorMessage = "Something went wrong. Please try again.";
    let errorData: any = null;

    try {
      errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Map HTTP status codes to user-friendly messages
    switch (response.status) {
      case 401:
        throw new Error(
          "Invalid API key. Please check your OpenRouter configuration."
        );
      case 429:
        throw new Error(
          "Rate limit reached. Please try again in a moment."
        );
      case 500:
      case 502:
      case 503:
        throw new Error(
          "AI service is temporarily unavailable. Please try again in a moment."
        );
      case 504:
        throw new Error("Request timed out. Please try again.");
      default:
        // For network errors or other issues
        if (response.status === 0 || !navigator.onLine) {
          throw new Error(
            "Unable to connect. Please check your internet connection."
          );
        }
        throw new Error(errorMessage);
    }
  }

  /**
   * Format file content for inclusion in messages
   * @deprecated Use formatFileContentForAI in ChatInterface instead
   */
  formatFileContent(fileName: string, content: string): string {
    return `Here's the file content:\n\n**${fileName}**\n\`\`\`\n${content}\n\`\`\``;
  }
}

// Export singleton instance
export const openRouterService = OpenRouterService.getInstance();

