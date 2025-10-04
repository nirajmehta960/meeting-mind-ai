import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      message,
      stream = false,
      messages: conversationMessages,
    } = await req.json();

    if (!message && !conversationMessages) {
      return new Response(
        JSON.stringify({ error: "Message or messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the AI_API_KEY from environment
    const apiKey = Deno.env.get("AI_API_KEY");

    if (!apiKey) {
      console.error(
        "AI_API_KEY not found in environment, please set up your AI service API key"
      );
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare messages array
    let messagesToSend = [
      {
        role: "system",
        content:
          "You are an AI assistant specialized in helping Product Managers with meeting-related tasks. You excel at:\n\n🎯 **CORE CAPABILITIES:**\n- Summarizing meeting transcripts and extracting key decisions\n- Identifying and organizing action items with owners and deadlines\n- Generating professional stakeholder emails and updates\n- Creating meeting recaps and follow-up plans\n- Analyzing meeting patterns and productivity insights\n\n📋 **MEETING ANALYSIS EXPERTISE:**\n- Extract key decisions, discussion points, and outcomes\n- Identify action items with clear owners, deadlines, and priorities\n- Generate professional stakeholder communications\n- Create structured meeting summaries and recaps\n- Organize follow-up plans and next steps\n\n📧 **COMMUNICATION SPECIALIST:**\n- Draft professional stakeholder update emails\n- Create meeting recaps for team members who couldn't attend\n- Generate contextually appropriate communications for different audiences\n- Maintain professional tone while being actionable and clear\n\n🔍 **FILE PROCESSING:**\nWhen users upload meeting transcripts or files, you will receive the content. You can:\n- Process and analyze meeting transcripts in various formats\n- Extract action items, decisions, and key points from raw meeting notes\n- Identify participants and stakeholders from meeting content\n- Generate structured summaries from unstructured meeting data\n\n💼 **RESPONSE STYLE:**\n- Always provide structured, actionable outputs\n- Use clear headings, bullet points, and organized sections\n- Include specific next steps and follow-up actions\n- Reference meeting context and participants when relevant\n- Be concise but comprehensive\n\n🚨 **CRITICAL RULES:**\n- When file content is provided, acknowledge and reference it directly\n- Extract real action items, decisions, and insights from the actual meeting content\n- Do not fabricate or create fictional meeting details\n- Always maintain professional tone suitable for business communications\n- Focus on actionable insights that help product managers save time on meeting documentation\n\nRemember: You're helping transform hours of meeting note-taking into minutes of productivity through AI-powered analysis and professional communication.",
      },
    ];

    if (conversationMessages) {
      messagesToSend = [...messagesToSend, ...conversationMessages];
    } else {
      messagesToSend.push({
        role: "user",
        content: message,
      });
    }

    // Call the AI service
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messagesToSend,
          stream: stream,
        }),
      }
    );

    if (!response.ok) {
      console.error("AI Gateway error:", await response.text());
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const reader = response.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ done: true })}\n\n`
                      )
                    );
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ content })}\n\n`
                        )
                      );
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            console.error("Streaming error:", error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Return regular response
      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content;

      if (!aiMessage) {
        console.error("No response from AI", data);
        return new Response(JSON.stringify({ error: "No response from AI" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ response: aiMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in AI call:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
