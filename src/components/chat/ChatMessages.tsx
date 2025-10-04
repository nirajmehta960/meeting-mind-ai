import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, User, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Message } from "./ChatWidget";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollUp = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollBy({ top: -300, behavior: "smooth" });
      setTimeout(() => checkScrollPosition(), 100);
    }
  };

  const scrollDown = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollBy({ top: 300, behavior: "smooth" });
      setTimeout(() => checkScrollPosition(), 100);
    }
  };

  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;

      console.log("Scroll check:", { scrollTop, scrollHeight, clientHeight });
      console.log("Can scroll up:", scrollTop > 10);
      console.log(
        "Can scroll down:",
        scrollTop < scrollHeight - clientHeight - 10
      );

      setCanScrollUp(scrollTop > 10);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10);
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Force scroll check after messages change
    setTimeout(() => {
      checkScrollPosition();
    }, 200);
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const handleScroll = (e: Event) => {
        e.stopPropagation();
        checkScrollPosition();
      };

      container.addEventListener("scroll", handleScroll);

      // Initial check after a small delay to ensure DOM is ready
      setTimeout(() => {
        checkScrollPosition();
      }, 100);

      // Check again after content loads
      setTimeout(() => {
        checkScrollPosition();
      }, 500);

      // Also check when content changes
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(() => checkScrollPosition(), 50);
      });
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, [messages]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderCodeBlock = (content: string) => {
    // Simple code block detection and highlighting
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>
        );
      }

      // Add code block
      const language = match[1] || "text";
      const code = match[2];
      parts.push(
        <div key={match.index} className="my-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {language}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(code)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <pre className="p-4 text-sm overflow-x-auto">
            <code className="text-foreground">{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Welcome to Meeting AI
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              I'm here to help you with meeting summaries, action items,
              stakeholder emails, and follow-up planning. Upload a meeting
              transcript to get started.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <div className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
              /summary - Meeting Summary
            </div>
            <div className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
              /actions - Action Items
            </div>
            <div className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
              /email - Stakeholder Email
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col min-h-0">
      {/* Scroll Controls - Always show when there are messages */}
      <div className="absolute right-2 top-2 z-50 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log("Scroll up clicked, canScrollUp:", canScrollUp);
            scrollUp();
          }}
          className="h-7 w-7 p-0 bg-primary text-primary-foreground hover:bg-primary/80 border border-primary shadow-lg transition-all"
          title={`Scroll up (${canScrollUp ? "enabled" : "disabled"})`}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log("Scroll down clicked, canScrollDown:", canScrollDown);
            scrollDown();
          }}
          className="h-7 w-7 p-0 bg-primary text-primary-foreground hover:bg-primary/80 border border-primary shadow-lg transition-all"
          title={`Scroll down (${canScrollDown ? "enabled" : "disabled"})`}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0"
        onWheel={(e) => {
          // Only stop propagation if we're not at the scroll boundaries
          const container = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = container;

          // Allow page scroll if chat is at top and user scrolls up
          if (scrollTop === 0 && e.deltaY < 0) {
            return; // Let the event bubble up for page scroll
          }

          // Allow page scroll if chat is at bottom and user scrolls down
          if (scrollTop >= scrollHeight - clientHeight - 10 && e.deltaY > 0) {
            return; // Let the event bubble up for page scroll
          }

          // Otherwise, handle scroll within chat
          e.stopPropagation();
        }}
        onScroll={(e) => e.stopPropagation()}
        style={{ maxHeight: "100%" }}
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 group animate-fade-in opacity-0",
              "animate-slide-up",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            {/* Avatar */}
            <Avatar
              className={cn(
                "w-8 h-8 border-2 transition-all duration-300 group-hover:scale-110",
                message.role === "user"
                  ? "border-primary bg-primary"
                  : "border-primary/50 bg-primary/10"
              )}
            >
              <AvatarFallback
                className={cn(
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>

            {/* Message Content */}
            <div
              className={cn(
                "flex-1 max-w-[80%] space-y-1",
                message.role === "user" ? "text-right" : "text-left"
              )}
            >
              <div
                className={cn(
                  "inline-block px-4 py-3 rounded-2xl relative transition-all duration-300 hover:shadow-lg",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto rounded-br-md"
                    : "glass-card rounded-bl-md",
                  message.isStreaming && "animate-pulse-glow"
                )}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.role === "assistant"
                    ? renderCodeBlock(message.content)
                    : message.content}
                  {message.isStreaming && (
                    <span className="inline-flex items-center ml-2">
                      <span className="flex space-x-1">
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </span>
                    </span>
                  )}
                </div>

                {/* Copy button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(message.content)}
                  className={cn(
                    "absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    "bg-background border shadow-sm hover:shadow-md"
                  )}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Timestamp */}
              <div
                className={cn(
                  "text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity px-2",
                  message.role === "user" ? "text-right" : "text-left"
                )}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 animate-fade-in">
            <Avatar className="w-8 h-8 border-2 border-primary/50 bg-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4 animate-spin" />
              </AvatarFallback>
            </Avatar>
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
