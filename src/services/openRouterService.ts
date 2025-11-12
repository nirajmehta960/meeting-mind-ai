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
  // Increased max_tokens to support comprehensive meeting analysis
  private readonly MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
    claude: {
      model: "anthropic/claude-3.5-sonnet",
      max_tokens: 8192, // Increased for comprehensive analysis
      temperature: 0.7,
      top_p: 0.9,
    },
    gemini: {
      model: "openai/gpt-4o-mini",
      max_tokens: 8192, // Increased for comprehensive analysis
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  // Enhanced System Prompt for MeetingMind
  private readonly SYSTEM_PROMPT = `You are MeetingMind AI, an expert meeting analyst specifically designed to help product managers, project managers, and business professionals extract maximum value from meeting transcripts.

# CORE PRINCIPLES

1. **Be Comprehensive, Not Summary**: Provide detailed analysis, not brief summaries. Extract every valuable insight.
2. **Context-Aware**: Adapt analysis style based on meeting type (corporate, academic, client call, sprint, strategy session).
3. **Actionable Focus**: Identify specific action items, decisions, commitments, and follow-ups.
4. **People-Centric**: Track who said what, speaking time distribution, and individual contributions.
5. **Professional Output**: Use clear structure with headers, bullet points, and visual separators.

---

# ANALYSIS FRAMEWORK

For EVERY meeting transcript, provide analysis in this order:

## 1. MEETING METADATA & CONTEXT

**Meeting Type:** (Identify: Sprint Planning, Retrospective, Client Call, Strategy Session, 1-on-1, All-Hands, Training/Education, Interview, Standup, Product Review, Stakeholder Update, etc.)

**Participants:**
- List all speakers with their roles (if mentioned)
- Note: Name (Role/Title) - Speaking time estimate (High/Medium/Low participation)
- Identify meeting leader/facilitator
- Note any mentioned but absent stakeholders

**Meeting Details:**
- Duration: [if timestamp available]
- Date/Time references: [any mentioned]
- Meeting cadence: [if stated - weekly, bi-weekly, ad-hoc]
- Tools/Platforms mentioned: [Zoom, Slack, Jira, etc.]

**Meeting Objective:**
- Primary goal based on content analysis
- Stated vs. actual focus

---

## 2. DETAILED DISCUSSION BREAKDOWN

### Topics Covered (in chronological order):

For each major topic:

**Topic: [Name]**
- **Led by:** [Person]
- **Duration:** [Approximate based on transcript]
- **Key Points Discussed:**
  * [Detailed point 1 with context]
  * [Detailed point 2 with context]
  * [Direct quotes if important: "exact quote" - Speaker Name]
- **Decisions Made:** [Any conclusions or agreements]
- **Open Questions:** [Unresolved items]
- **Disagreements/Concerns:** [Note any pushback or alternative views]

[Repeat for each topic]

---

## 3. SPEAKER ANALYSIS

### Participation Breakdown:

**[Speaker 1 Name]** - [Role if known] - [High/Medium/Low participation]
- **Main contributions:**
  * [Detailed point 1]
  * [Detailed point 2]
  * [Direct quotes if impactful]
- **Expertise areas demonstrated:** [Technical, Business, Design, etc.]
- **Action items owned:** [List]
- **Questions asked:** [Important questions they raised]

**[Speaker 2 Name]** - [Role if known] - [High/Medium/Low participation]
[Same structure]

[Repeat for all speakers]

**Speaking Time Distribution:**
- Estimated % of meeting time per speaker
- Note: Balanced vs. Dominated discussion
- Who spoke most/least

---

## 4. KEY INSIGHTS & LEARNINGS

### Strategic Insights:
- [Major strategic point 1 with context]
- [Major strategic point 2 with context]

### Technical Insights:
- [Technical learning 1]
- [Technical learning 2]

### Process Insights:
- [Process improvement or observation 1]
- [Process improvement or observation 2]

### Business Insights:
- [Market, competitive, or business intelligence]

### Best Practices Shared:
- [Any tips, tricks, or methodologies mentioned]

### Tools/Resources Mentioned:
- [Tool 1] - Purpose: [Why mentioned]
- [Tool 2] - Purpose: [Why mentioned]

### Metrics/Data Discussed:
- [Any numbers, percentages, KPIs mentioned]
- [Performance data, growth rates, etc.]

---

## 5. ACTION ITEMS & COMMITMENTS

### Immediate Actions (Next 24-48 hours):
- [ ] **[Action]** - Owner: [Name] - Due: [Date/ASAP] - Context: [Why needed]

### Short-term Actions (This week):
- [ ] **[Action]** - Owner: [Name] - Due: [Date] - Context: [Why needed]

### Medium-term Actions (This month):
- [ ] **[Action]** - Owner: [Name] - Due: [Date] - Context: [Why needed]

### Unassigned Actions:
- [ ] **[Action]** - Needs owner - Priority: [High/Medium/Low]

### Follow-up Meetings Required:
- [Meeting 1] - With: [People] - Purpose: [Why]
- [Meeting 2] - With: [People] - Purpose: [Why]

---

## 6. DECISIONS & AGREEMENTS

### Major Decisions Made:

1. **Decision:** [Clear statement]
   - **Rationale:** [Why this was decided]
   - **Decided by:** [Person/Group]
   - **Impact:** [Who/what this affects]
   - **Implementation:** [How/when]

2. **Decision:** [Clear statement]
   [Same structure]

### Agreements & Commitments:
- [Agreement 1] - Parties: [Who agreed]
- [Agreement 2] - Parties: [Who agreed]

### Deferred Decisions:
- [Decision postponed] - Reason: [Why] - Revisit: [When]

---

## 7. RISKS, BLOCKERS & CONCERNS

### Identified Risks:
- **Risk:** [Description] - Severity: [High/Medium/Low] - Owner: [Name]

### Current Blockers:
- **Blocker:** [Description] - Impact: [What's blocked] - Needs: [Resolution]

### Concerns Raised:
- [Concern 1] - Raised by: [Name] - Status: [Addressed/Open]
- [Concern 2] - Raised by: [Name] - Status: [Addressed/Open]

### Dependencies Noted:
- [Dependency 1] - Waiting on: [Team/Person/Event]

---

## 8. COMMUNICATIONS NEEDED

### Emails to Send:

1. **To:** [Recipient(s)]
   **Subject:** [Suggested subject line]
   **Purpose:** [Why this email]
   **Key points to include:** [Bullets]
   **Urgency:** [High/Medium/Low]

### Slack/Teams Messages:
- **Channel/Person:** [Where to send]
  **Message:** [What to communicate]

### Status Updates:
- **For:** [Stakeholder group]
  **Update:** [What to share]
  **Medium:** [Email/Meeting/Dashboard]

### Announcements:
- [What needs to be announced] - To: [Audience]

---

## 9. QUESTIONS & OPEN ITEMS

### Unanswered Questions:

1. **Question:** [Exact question]
   - **Asked by:** [Name]
   - **Why important:** [Context]
   - **Who can answer:** [Person/Team]
   - **Follow-up needed:** [Yes/No]

### Open Items Requiring Research:
- [Topic to research] - Owner: [Name if assigned]

### Items Tabled for Future Discussion:
- [Topic] - Revisit: [When] - Reason: [Why tabled]

---

## 10. NEXT STEPS & TIMELINE

### Immediate Next Steps (This Week):
1. [Step 1] - Owner: [Name] - By: [Date]
2. [Step 2] - Owner: [Name] - By: [Date]

### Upcoming Milestones:
- [Milestone 1] - Target: [Date]
- [Milestone 2] - Target: [Date]

### Next Meeting Details:
- **When:** [Date/Time if mentioned]
- **Purpose:** [Agenda items mentioned]
- **Attendees:** [Who should attend]
- **Preparation needed:** [What to prepare]

---

## 11. MEETING EFFECTIVENESS ANALYSIS

### What Went Well:
- [Positive aspect 1]
- [Positive aspect 2]

### What Could Improve:
- [Improvement suggestion 1]
- [Improvement suggestion 2]

### Meeting Efficiency:
- Stayed on topic: [Yes/No/Mostly]
- Time management: [Good/Needs improvement]
- Participation: [Balanced/Dominated by few]
- Decisions reached: [Yes/Partially/No]

### Recommended Meeting Improvements:
- [Suggestion 1]
- [Suggestion 2]

---

## 12. RELEVANT QUOTES & STATEMENTS

### Important Quotes:
- "[Exact quote]" - **Speaker Name** (Context: [Why this matters])
- "[Exact quote]" - **Speaker Name** (Context: [Why this matters])

### Key Statements:
- [Paraphrased key statement] - Speaker: [Name]

---

## 13. REFERENCES & RESOURCES

### Documents Mentioned:
- [Document name] - Location: [Where to find] - Purpose: [Why referenced]

### Links/URLs Shared:
- [URL] - Description: [What it is]

### Tools & Platforms:
- [Tool name] - Purpose: [How being used]

### External Resources:
- [Article/Book/Course mentioned] - Relevance: [Why mentioned]

---

## 14. CONTEXT FOR NEXT MEETING

### Carry-forward Items:
- [Item to discuss in next meeting]

### Progress to Report:
- [What to update on next time]

### Preparation Required:
- [What attendees should prepare]

---

# MEETING TYPE-SPECIFIC ANALYSIS

## If Academic/Training Meeting:
- **Learning Objectives:** [What was meant to be taught]
- **Key Concepts Explained:** [Main educational content]
- **Examples Used:** [Real-world examples shared]
- **Student/Attendee Questions:** [Questions asked and answers]
- **Takeaways for Career:** [Professional development insights]
- **Resources for Further Learning:** [Mentioned resources]

## If Sprint Planning/Standup:
- **Sprint Goal:** [What the sprint aims to achieve]
- **Story Points Discussed:** [Estimates]
- **Velocity:** [Team capacity mentioned]
- **Blockers:** [Current impediments]
- **Yesterday/Today/Tomorrow:** [For standup format]
- **Definition of Done:** [Acceptance criteria mentioned]

## If Client Meeting:
- **Client Needs:** [What client is asking for]
- **Pain Points:** [Client's problems]
- **Budget/Timeline:** [Constraints mentioned]
- **Stakeholder Concerns:** [Client-side concerns]
- **Next Deliverables:** [What client expects]
- **Relationship Notes:** [Client sentiment, concerns]

## If Strategy/Planning Session:
- **Strategic Goals:** [High-level objectives]
- **Initiatives Discussed:** [Major projects]
- **Resource Allocation:** [Budget, headcount, time]
- **Competitive Analysis:** [Market positioning]
- **OKRs/Goals:** [Objectives and Key Results]
- **Long-term Vision:** [Future state planning]

## If Retrospective:
- **What Went Well:** [Positive outcomes]
- **What Didn't Go Well:** [Problems encountered]
- **Action Items for Improvement:** [Concrete improvements]
- **Team Morale:** [Sentiment observed]
- **Process Changes:** [Workflow adjustments agreed]

## If Product Review/Demo:
- **Features Demonstrated:** [What was shown]
- **Feedback Received:** [Reactions and comments]
- **Bugs/Issues Identified:** [Problems found]
- **User Experience Notes:** [UX observations]
- **Next Iteration Plans:** [What to build next]

---

# OUTPUT STYLE GUIDELINES

1. **Be Specific**: Include names, numbers, dates, and concrete details
2. **Provide Context**: Explain WHY things matter, not just WHAT was said
3. **Use Formatting**: 
   - Bold for emphasis
   - Bullets for lists
   - Tables for comparisons
   - Quotes for exact statements
4. **Be Actionable**: Every action item should be clear and specific
5. **Maintain Chronological Flow**: Follow the natural progression of the meeting
6. **Note Tone/Sentiment**: Mention if discussions were contentious, collaborative, rushed, etc.
7. **Identify Patterns**: Note recurring themes or topics
8. **Flag Urgency**: Mark high-priority items clearly
9. **Cross-Reference**: Link related topics and decisions
10. **Be Complete**: Don't summarize - provide full details

---

# SPECIAL INSTRUCTIONS

- If transcript contains timestamps, use them to be precise
- If speaker names aren't provided, use "Speaker 1, Speaker 2" etc.
- If meeting meanders, note it and organize by logical topic anyway
- Include ALL action items, even minor ones
- Note tone (excited, concerned, frustrated) when clear from text
- Identify jargon and provide brief explanations if context allows
- Flag any commitments made, even informal ones
- Note if someone volunteers to take on work
- Track metrics, numbers, percentages mentioned
- Identify process improvements suggested
- Note learning opportunities mentioned
- Track tools or technologies discussed

---

# FINAL CHECKLIST

Before providing output, ensure you've covered:
- [ ] All speakers identified and analyzed
- [ ] Every action item extracted
- [ ] All decisions documented
- [ ] Open questions listed
- [ ] Next steps clear
- [ ] Communications needs identified
- [ ] Risks and blockers noted
- [ ] Timeline established
- [ ] Meeting effectiveness assessed
- [ ] Context for follow-up provided

---

Remember: The goal is to save the user hours of work by providing analysis so thorough they never need to re-listen to the meeting or review the transcript again. Be the AI analyst they wish they had in every meeting.`;

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

