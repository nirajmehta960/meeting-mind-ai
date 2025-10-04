import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  Settings,
  FileText,
  CheckSquare,
  Mail,
  Clock,
  Sparkles,
  User,
} from "lucide-react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import Header from "@/components/Header";
import { meetingAIService } from "@/utils/aiService";
import { StreamingMessage } from "./StreamingMessage";
import type { AIModel } from "@/types/ai";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatWidgetProps {
  isFullPage?: boolean;
  isEmbedded?: boolean;
  useMeetingChat?: boolean;
}

export default function ChatWidget({
  isFullPage = false,
  isEmbedded = false,
  useMeetingChat = false,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState<AIModel>("claude");
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // For full page mode, always show chat
  useEffect(() => {
    if (isFullPage) {
      setIsOpen(true);
      setIsFullscreen(true);
    }
  }, [isFullPage]);

  // For embedded mode, always show chat but not fullscreen
  useEffect(() => {
    if (isEmbedded) {
      setIsOpen(true);
      setIsFullscreen(false);
    }
  }, [isEmbedded]);

  // Listen for custom event from hero button
  useEffect(() => {
    const handleOpenChatWidget = () => {
      setIsOpen(true);
      setIsFullscreen(true);
    };

    window.addEventListener("openChatWidget", handleOpenChatWidget);
    return () =>
      window.removeEventListener("openChatWidget", handleOpenChatWidget);
  }, []);

  // Prevent body scroll when chat is open (but not in embedded mode)
  useEffect(() => {
    if (isOpen && !isEmbedded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isEmbedded]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = async (content: string, attachedFiles?: File[]) => {
    let fullContent = content;

    // Process attached files and add their content to the message
    if (attachedFiles && attachedFiles.length > 0) {
      try {
        const fileContents = await Promise.all(
          attachedFiles.map(async (file) => {
            const text = await readFileContent(file);
            return `\n\n--- File: ${file.name} ---\n${text}\n--- End of ${file.name} ---\n`;
          })
        );

        fullContent = content + fileContents.join("");
      } catch (error) {
        console.error("Error reading files:", error);
        // Continue with original content if file reading fails
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: fullContent,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setShowQuickActions(false);
    setStreamingMessage("");

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Get conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call AI service with streaming
      const response = await meetingAIService.sendMessage(
        fullContent,
        selectedModel,
        conversationHistory,
        (streamContent: string) => {
          setStreamingMessage(streamContent);
        },
        controller.signal
      );

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      // Clear streaming and add final message
      setStreamingMessage(null);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If not open, increment unread count
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.message === "Request aborted") {
        setStreamingMessage(null);
        return;
      }

      console.error("Error sending message:", error);
      setStreamingMessage(null);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
      setAbortController(null);
    }
  };

  // Helper function to read file content
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;

        // For PDFs, we'll need a different approach
        if (file.type === "application/pdf") {
          resolve(
            `[PDF Content - ${file.name}]\nNote: PDF text extraction is not available in this version. Please copy and paste the transcript text directly, or convert the PDF to text format.`
          );
        } else {
          resolve(content);
        }
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      if (file.type === "application/pdf") {
        // For now, return a placeholder for PDFs
        resolve(
          `[PDF Content - ${file.name}]\nNote: PDF text extraction is not available in this version. Please copy and paste the transcript text directly, or convert the PDF to text format.`
        );
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleCommand = (command: string) => {
    let prompt = "";
    switch (command) {
      case "/summary":
        prompt =
          "I'll help you create a comprehensive meeting summary. Please share the meeting transcript or notes you'd like me to analyze.";
        break;
      case "/actions":
        prompt =
          "I'll extract and organize action items from your meeting. Please provide the meeting transcript or notes.";
        break;
      case "/email":
        prompt =
          "I'll generate a professional stakeholder email based on your meeting. Please share the meeting summary or key points.";
        break;
      case "/decisions":
        prompt =
          "I'll identify and highlight the key decisions made in your meeting. Please share the meeting transcript.";
        break;
      case "/followup":
        prompt =
          "I'll create a structured follow-up plan. Please share the meeting notes and action items.";
        break;
      case "/notes":
        prompt =
          "I'll help format and organize your meeting notes. Please share the raw meeting notes or transcript.";
        break;
      case "/timeline":
        prompt =
          "I'll help update project timelines based on meeting decisions. Please share the meeting summary and current timeline.";
        break;
      case "/recap":
        prompt =
          "I'll generate a quick meeting recap for team members. Please share the meeting transcript or summary.";
        break;
      default:
        return;
    }
    handleSendMessage(prompt);
  };

  // If using meeting chat, render prodmate-1 style chat
  if (useMeetingChat) {
    return (
      <div className="h-screen flex flex-col bg-white text-gray-900 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Welcome Screen - Fixed height, no scroll */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="text-center max-w-4xl w-full">
            <div className="mb-8">
              <h1 className="text-5xl sm:text-7xl mb-6 text-black font-bold tracking-tight">
                MeetingMind
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-normal mb-8">
                Transform meeting chaos into actionable insights. Get instant
                summaries, extract action items, and generate stakeholder emails
                with AI precision.
              </p>
            </div>

            {/* Feature Cards - ToDesktop style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-6xl mx-auto">
              <div className="group bg-white border border-gray-100 rounded-lg p-6 hover:shadow-sm hover:border-gray-200 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-black">
                    Smart Summaries
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    AI-powered meeting summaries with key insights
                  </p>
                </div>
              </div>

              <div className="group bg-white border border-gray-100 rounded-lg p-6 hover:shadow-sm hover:border-gray-200 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 bg-green-600 rounded-md flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-black">
                    Action Items
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Extract and organize actionable tasks
                  </p>
                </div>
              </div>

              <div className="group bg-white border border-gray-100 rounded-lg p-6 hover:shadow-sm hover:border-gray-200 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-black">
                    Email Drafts
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Generate stakeholder communication
                  </p>
                </div>
              </div>

              <div className="group bg-white border border-gray-100 rounded-lg p-6 hover:shadow-sm hover:border-gray-200 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-md flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-black">
                    Follow-ups
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Plan and track next steps
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    const event = new CustomEvent("setSuggestion", {
                      detail: "Summarize this meeting transcript",
                    });
                    window.dispatchEvent(event);
                  }}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  Start with Meeting Summary
                </button>
                <button
                  onClick={() => {
                    const event = new CustomEvent("setSuggestion", {
                      detail: "Extract action items from the discussion",
                    });
                    window.dispatchEvent(event);
                  }}
                  className="px-8 py-3 bg-white hover:bg-gray-50 text-black rounded-lg font-medium border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  Get Action Items
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto bg-white scrollbar-thin">
            <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className="flex gap-3 group animate-fade-in opacity-0 animate-slide-up"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`flex-1 max-w-[80%] space-y-1 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-3 rounded-2xl relative transition-all duration-300 hover:shadow-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto rounded-br-md"
                          : "bg-card border border-border/50 rounded-bl-md"
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      className={`text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity px-2 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <StreamingMessage content={streamingMessage} />
              )}
            </div>
          </div>
        )}

        {/* Input at bottom - Fixed position */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <ChatInput
            onSendMessage={handleSendMessage}
            onCommand={handleCommand}
            disabled={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    );
  }

  // Don't show floating button in full page or embedded mode
  if (!isOpen && !isFullPage && !isEmbedded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isFullPage
          ? "absolute inset-0 bg-background"
          : isFullscreen
          ? "fixed inset-0 bg-background/95 backdrop-blur-sm z-50"
          : isEmbedded
          ? "w-full max-w-4xl mx-auto"
          : "fixed bottom-6 right-6 w-96 h-[600px] z-50"
      )}
      onWheel={(e) => !isEmbedded && e.stopPropagation()}
      onClick={(e) => !isEmbedded && e.stopPropagation()}
    >
      <Card
        ref={chatRef}
        className={cn(
          "flex flex-col h-full overflow-hidden shadow-2xl border-primary/20 transition-all duration-500",
          isFullPage
            ? "w-full h-full rounded-none"
            : isFullscreen
            ? "w-full max-w-4xl mx-auto my-8 rounded-2xl"
            : isEmbedded
            ? "w-full h-[600px] rounded-2xl mx-6"
            : "rounded-2xl",
          "glass-card"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Meeting AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Analyzing..." : "Ready to help"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {!isFullPage && !isEmbedded && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-8 w-8 p-0"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <QuickActions
            onCommand={handleCommand}
            onClose={() => setShowQuickActions(false)}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatMessages messages={messages} isLoading={isLoading} />
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onCommand={handleCommand}
          disabled={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </Card>
    </div>
  );
}
