import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip,
  Square,
  ChevronDown,
  Upload,
  X,
  Mic,
  MicOff,
  ArrowUp,
} from "lucide-react";
import { FileSpreadsheet, FileText, File as FileIcon } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { aiService } from "../../utils/aiService";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

interface MessageInputProps {
  conversationId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
}) => {
  const [message, setMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Speech recognition
  const {
    transcript,
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition();

  const {
    addMessage,
    setConversationLoading,
    setConversationStreaming,
    setConversationAbortController,
    stopConversationAI,
    getConversationState,
    getCurrentConversation,
    createConversation,
    setCurrentConversation,
    selectedModel,
    setSelectedModel,
    uploadedFiles,
    removeFile,
    addFile,
  } = useAppStore();

  // Get conversation-specific state
  const { isLoading } = getConversationState(conversationId);

  const quickSuggestions = [
    "Create a competitive analysis framework",
    "Help me prioritize features for Q1",
    "Design a user research study",
    "Build a KPI dashboard strategy",
    "Analyze market trends and opportunities",
  ];

  // Check if this is a new conversation (no messages yet)
  const conversation = getCurrentConversation();
  const isNewConversation = !conversation || conversation.messages.length === 0;

  // Animated suggestions for "Try:" section
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [suggestionText, setSuggestionText] = useState("");
  const [isSuggestionTyping, setIsSuggestionTyping] = useState(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModelSelector &&
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModelSelector]);

  // Listen for suggestion clicks from welcome screen
  useEffect(() => {
    const handleSuggestion = (event: CustomEvent) => {
      setMessage(event.detail);
      // Focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener("setSuggestion", handleSuggestion as EventListener);
    return () => {
      window.removeEventListener(
        "setSuggestion",
        handleSuggestion as EventListener
      );
    };
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, []);

  // File selection handler
  const handleFileSelection = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;

          // Parse content based on file type
          let parsedContent: any[] = [];
          try {
            if (file.name.endsWith(".json")) {
              const jsonData = JSON.parse(content);
              parsedContent = Array.isArray(jsonData) ? jsonData : [jsonData];
            } else if (file.name.endsWith(".csv")) {
              // Simple CSV parsing - split by lines and commas
              const lines = content.split("\n").filter((line) => line.trim());
              const headers = lines[0]?.split(",") || [];
              parsedContent = lines.slice(1).map((line) => {
                const values = line.split(",");
                const obj: any = {};
                headers.forEach((header, index) => {
                  obj[header.trim()] = values[index]?.trim() || "";
                });
                return obj;
              });
            } else {
              // For text files, split by lines
              parsedContent = content.split("\n").filter((line) => line.trim());
            }
          } catch (error) {
            console.error("Error parsing file:", error);
            parsedContent = [content]; // Fallback to raw content
          }

          // Add file to store
          addFile({
            name: file.name,
            type: file.type,
            content: parsedContent,
            size: file.size,
            processed: true,
          });
        };

        if (
          file.type.includes("text") ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".json")
        ) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      });
    },
    [addFile]
  );

  // Handle file input click
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelection(files);
    // Reset input
    e.target.value = "";
  };

  // Animation for suggestions
  useEffect(() => {
    if (!isNewConversation) return; // Don't animate if not a new conversation

    const currentSuggestionText = quickSuggestions[currentSuggestion];

    if (isSuggestionTyping) {
      if (suggestionText.length < currentSuggestionText.length) {
        const timer = setTimeout(() => {
          setSuggestionText(
            currentSuggestionText.slice(0, suggestionText.length + 1)
          );
        }, 80);
        return () => clearTimeout(timer);
      } else {
        // Finished typing, wait then start deleting
        const timer = setTimeout(() => {
          setIsSuggestionTyping(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      if (suggestionText.length > 0) {
        const timer = setTimeout(() => {
          setSuggestionText(suggestionText.slice(0, -1));
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Finished deleting, move to next suggestion
        setCurrentSuggestion((prev) => (prev + 1) % quickSuggestions.length);
        setIsSuggestionTyping(true);
      }
    }
  }, [
    suggestionText,
    isSuggestionTyping,
    currentSuggestion,
    isNewConversation,
  ]);

  // Auto-trigger AI response when loading state changes and there's a new user message
  useEffect(() => {
    const handleAIResponse = async () => {
      // Only proceed if this conversation is loading
      if (!isLoading) return;

      const conversation = getCurrentConversation();
      // Ensure we're working with the correct conversation
      if (!conversation || conversation.id !== conversationId) return;

      // Check if there are messages and the last one is from user
      if (conversation.messages.length === 0) return;

      const lastMessage =
        conversation.messages[conversation.messages.length - 1];

      // Only respond to user messages, and avoid duplicate responses
      if (lastMessage.role !== "user") return;

      // Check if there's already an assistant message after the last user message
      const userMessages = conversation.messages.filter(
        (msg) => msg.role === "user"
      );
      const assistantMessages = conversation.messages.filter(
        (msg) => msg.role === "assistant"
      );

      // If we have equal or more assistant messages than user messages, don't make another call
      if (assistantMessages.length >= userMessages.length) {
        setConversationLoading(conversationId, false);
        return;
      }

      // Check if there's already an active request for this conversation
      const conversationState = getConversationState(conversationId);
      if (conversationState.streamingMessage !== null) {
        return; // Already processing
      }

      // Create abort controller for this request
      const abortController = new AbortController();
      setConversationAbortController(conversationId, abortController);

      try {
        // Get conversation history for context (excluding the last message since it's the current one)
        const conversationHistory = conversation.messages
          .slice(0, -1)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        // Stream AI response
        const response = await aiService.sendMessage(
          lastMessage.content,
          selectedModel,
          conversationHistory,
          (streamContent: string) => {
            // Check if request was aborted
            if (abortController.signal.aborted) return;
            setConversationStreaming(conversationId, streamContent);
          },
          abortController.signal // Pass abort signal
        );

        // Check if request was aborted before adding final message
        if (abortController.signal.aborted) return;

        // Clear streaming and add final message
        setConversationStreaming(conversationId, null);
        addMessage(conversationId, {
          content: response,
          role: "assistant",
          metadata: {
            model: "AI Assistant",
            tokens: response.length,
            context: "general",
          },
        });
      } catch (error) {
        // Don't show error if request was aborted
        if (error instanceof Error && error.message === "Request aborted") {
          // console.log("Request was aborted by user");
          setConversationStreaming(conversationId, null);
          return;
        }

        console.error("Error sending message:", error);
        setConversationStreaming(conversationId, null);
        addMessage(conversationId, {
          content:
            "I apologize, but I encountered an error processing your request. Please check your connection and try again.",
          role: "assistant",
        });
      } finally {
        setConversationLoading(conversationId, false);
        setConversationStreaming(conversationId, null);
        setConversationAbortController(conversationId, null);
      }
    };

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(handleAIResponse, 100);
    return () => clearTimeout(timeoutId);
  }, [isLoading, conversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasContent = message.trim() || uploadedFiles.length > 0;
    if (!hasContent || isLoading || isSubmitting) return;

    // Prevent double submissions
    setIsSubmitting(true);

    // console.log("Submit triggered", {
    //   message: message.trim(),
    //   uploadedFiles: uploadedFiles.length,
    //   isLoading,
    // });

    const userMessage =
      message.trim() ||
      "I've uploaded files for analysis. Please analyze the data and provide insights.";
    setMessage("");
    resetTranscript();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }

    // If no conversation exists, create one first
    let targetConversationId = conversationId;
    if (!conversationId) {
      const newConversationId = createConversation();
      targetConversationId = newConversationId;
      setCurrentConversation(newConversationId);
    }

    // Add user message
    addMessage(targetConversationId, {
      content: userMessage,
      role: "user",
    });

    // Set loading state (this will trigger the AI response via useEffect)
    setConversationLoading(targetConversationId, true);

    // Reset submitting state after a short delay
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleStop = () => {
    // console.log(`Stop button clicked for conversation ${conversationId}`);

    // Immediately clear streaming to stop visual output
    setConversationStreaming(conversationId, null);

    // Stop the AI processing
    stopConversationAI(conversationId);

    // console.log(`AI response stopped for conversation ${conversationId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    // Add Cmd/Ctrl+Enter as alternative send shortcut
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "48px"; // Start with smaller height
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`; // Max 100px instead of 120px
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(message);
    }
  };

  // Update textarea value with speech transcript
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
      adjustTextareaHeight();
    }
  }, [transcript]);

  // Show speech error
  useEffect(() => {
    if (speechError) {
      console.error("Speech recognition error:", speechError);
      // You can add a toast notification here if you have one
    }
  }, [speechError]);

  const getFileIcon = (type: string) => {
    if (
      type.includes("spreadsheet") ||
      type.includes("excel") ||
      type.includes("csv")
    ) {
      return FileSpreadsheet;
    }
    if (type.includes("text") || type.includes("json")) {
      return FileText;
    }
    return FileIcon;
  };

  const getFileTypeLabel = (type: string, name: string) => {
    if (type.includes("csv") || name.endsWith(".csv")) return "Spreadsheet";
    if (
      type.includes("excel") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls")
    )
      return "Spreadsheet";
    if (type.includes("json") || name.endsWith(".json")) return "File";
    if (type.includes("text") || name.endsWith(".txt")) return "Document";
    return "File";
  };

  const getFileIconColor = (type: string, name: string) => {
    if (type.includes("csv") || name.endsWith(".csv")) return "bg-green-500";
    if (
      type.includes("excel") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls")
    )
      return "bg-green-600";
    if (type.includes("json") || name.endsWith(".json")) return "bg-blue-500";
    if (type.includes("text") || name.endsWith(".txt")) return "bg-red-500";
    return "bg-gray-500";
  };

  const isEmptyConversation = !conversationId;

  return (
    <div
      ref={dropZoneRef}
      className={`transition-all duration-500 bg-background ${
        isEmptyConversation
          ? "relative max-w-2xl mx-auto w-full p-4"
          : "relative w-full p-4"
      } ${isDragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="text-center">
              <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-primary font-medium">
                Drop files here to upload
              </p>
              <p className="text-primary/70 text-sm">
                Supports CSV, JSON, TXT files
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.json,.txt,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {/* Try Suggestions - Only show for new conversations (hidden on small screens) */}
        {isNewConversation && !isEmptyConversation && (
          <div className="mb-4 text-center">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Try: </span>
              <button
                onClick={() => setMessage(suggestionText)}
                className="hidden sm:inline text-primary hover:text-primary/80 underline-offset-2 hover:underline cursor-pointer transition-colors duration-200"
              >
                {suggestionText}
                {isSuggestionTyping ? (
                  <span className="animate-pulse ml-0.5">|</span>
                ) : (
                  ""
                )}
              </button>
            </div>
          </div>
        )}

        {/* File Attachments - Horizontal Scrollable */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 file-upload-enter">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 scroll-smooth">
              {uploadedFiles.map((file) => {
                const IconComponent = getFileIcon(file.type);
                const typeLabel = getFileTypeLabel(file.type, file.name);
                const iconColor = getFileIconColor(file.type, file.name);

                return (
                  <div
                    key={file.name}
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl px-3 py-2 shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all duration-200 group flex-shrink-0"
                    style={{ minWidth: "200px", maxWidth: "280px" }}
                  >
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}
                    >
                      <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-primary/70 truncate">
                        {typeLabel} •{" "}
                        {Array.isArray(file.content) ? file.content.length : 1}{" "}
                        records
                      </p>
                    </div>

                    <button
                      onClick={() => removeFile(file.name)}
                      className="w-5 h-5 flex items-center justify-center text-primary/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          {/* Modern Chat Input Container */}
          <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/30 overflow-hidden">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.03] opacity-0 focus-within:opacity-100 transition-opacity duration-500"></div>

            {/* Text Input Area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "Listening..."
                    : "Ask about product management..."
                }
                disabled={isLoading}
                className="relative w-full px-6 py-4 resize-none focus:outline-none bg-transparent text-foreground disabled:opacity-50 transition-all duration-300 text-base leading-relaxed min-h-[60px] auto-resize z-10 rounded-3xl border-0 outline-0 ring-0 focus:border-0 focus:outline-0 focus:ring-0 placeholder-muted-foreground/70 sm:placeholder-transparent"
                rows={1}
              />
              {/* Desktop-only placeholder overlay */}
              {!message && (
                <div
                  className={`hidden sm:block absolute left-6 top-4 pointer-events-none text-base z-5 ${
                    isListening ? "text-red-500" : "text-muted-foreground/70"
                  }`}
                >
                  {isListening
                    ? "Listening..."
                    : "Ask about product strategy, roadmapping, user research, or any PM topic..."}
                </div>
              )}
            </div>

            {/* Controls Bar - No divider line */}
            <div className="relative flex items-center justify-between px-4 py-3 bg-transparent">
              {/* Left Side Controls */}
              <div className="flex items-center gap-2">
                {/* Paperclip - File Upload */}
                <button
                  type="button"
                  onClick={handleFileInputClick}
                  disabled={isLoading}
                  className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-secondary/60 hover:bg-secondary/80 text-muted-foreground hover:text-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm"
                  title="Upload files (CSV, JSON, TXT)"
                >
                  <Paperclip className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                  {uploadedFiles.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">
                        {uploadedFiles.length}
                      </span>
                    </div>
                  )}
                </button>

                {/* Model Selector */}
                <div ref={modelSelectorRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    disabled={isLoading}
                    className="group flex items-center gap-2 px-3 py-2 bg-secondary/60 hover:bg-secondary/80 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      {/* Model Icon */}
                      <div className="relative w-5 h-5 rounded-lg overflow-hidden bg-white/90 flex items-center justify-center shadow-sm">
                        <img
                          src={
                            selectedModel === "claude"
                              ? "/claude-color.svg"
                              : "/gemini-color.svg"
                          }
                          alt={selectedModel === "claude" ? "Claude" : "Gemini"}
                          className="w-4 h-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                      {/* Model Name */}
                      <span className="text-sm font-medium text-foreground hidden sm:block">
                        {selectedModel === "claude"
                          ? "Claude 4.0"
                          : "Gemini 2.5"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3 h-3 text-muted-foreground transition-transform duration-300 ${
                        showModelSelector ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Model Selector Dropdown - Simple original design */}
                  {showModelSelector && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-[100]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModel("claude");
                          setShowModelSelector(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors duration-200 rounded-t-lg"
                      >
                        <img
                          src="/claude-color.svg"
                          alt="Claude"
                          className="w-4 h-4 mr-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                        <span>Claude 4.0 Sonnet</span>
                        {selectedModel === "claude" && (
                          <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModel("gemini");
                          setShowModelSelector(false);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors duration-200 rounded-b-lg"
                      >
                        <img
                          src="/gemini-color.svg"
                          alt="Gemini"
                          className="w-4 h-4 mr-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                        <span>Gemini 2.5 Pro</span>
                        {selectedModel === "gemini" && (
                          <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-2">
                {/* Microphone Button - Speech to Text */}
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isLoading}
                    className={`group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm ${
                      isListening
                        ? "bg-red-500/15 border border-red-500 text-red-500 animate-pulse"
                        : "bg-secondary/60 hover:bg-secondary/80 text-muted-foreground hover:text-primary"
                    }`}
                    title={isListening ? "Stop recording" : "Start voice input"}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    {isListening && (
                      <div className="absolute inset-1 rounded-lg border border-red-500 animate-ping opacity-50" />
                    )}
                  </button>
                )}

                {/* Send/Stop Button */}
                <button
                  type={isLoading ? "button" : "submit"}
                  onClick={isLoading ? handleStop : undefined}
                  disabled={
                    (!isLoading &&
                      !message.trim() &&
                      uploadedFiles.length === 0) ||
                    isSubmitting
                  }
                  className={`group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transform active:scale-95 ${
                    isLoading
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                      : message.trim() || uploadedFiles.length > 0
                      ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
                      : "bg-secondary/60 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : (
                    <ArrowUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  )}

                  {/* Subtle glow effect for active state */}
                  {(message.trim() || uploadedFiles.length > 0) &&
                    !isLoading && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/90 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Compact Footer info - Hidden on mobile */}
        <div className="hidden sm:flex items-center justify-center mt-3 text-xs text-muted-foreground">
          Powered by{" "}
          {selectedModel === "claude" ? "Claude 4.0 Sonnet" : "Gemini 2.5 Pro"}.
          AI can make mistakes. Always verify important information.
        </div>
      </div>
    </div>
  );
};
