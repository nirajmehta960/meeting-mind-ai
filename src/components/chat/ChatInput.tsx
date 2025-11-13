import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Paperclip,
  Mic,
  Send,
  Command,
  MicOff,
  FileText,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VoiceInput } from "./VoiceInput";
import { SuggestionChips } from "./SuggestionChips";
import { meetingAIService } from "@/utils/aiService";
import { ModelSelector } from "@/components/ui/ModelSelector";
import type { AIModel } from "@/types/ai";

interface ChatInputProps {
  onSendMessage: (message: string, attachedFiles?: File[]) => void;
  onCommand: (command: string) => void;
  disabled?: boolean;
  selectedModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

export function ChatInput({
  onSendMessage,
  onCommand,
  disabled = false,
  selectedModel = "claude",
  onModelChange,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxChars = 100000; // Increased limit to 100k characters
  const charCount = message.length;
  const isOverLimit = charCount > maxChars;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Command detection
  useEffect(() => {
    const shouldShowCommands = message.startsWith("/") && message.length > 0;
    setShowCommands(shouldShowCommands);
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isOverLimit || disabled) return;

    // Check if it's a command
    if (message.startsWith("/")) {
      const command = message.toLowerCase().split(" ")[0];
      onCommand(command);
    } else {
      onSendMessage(
        message.trim(),
        attachedFiles.length > 0 ? attachedFiles : undefined
      );
    }

    setMessage("");
    setAttachedFiles([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/json",
      "text/markdown",
      "application/rtf",
    ];

    const validFiles = files.filter((file) => {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit for larger meeting transcripts
        toast.error(`File ${file.name} is too large (max 50MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File ${file.name} type not supported. Supported types: PDF, DOC, DOCX, TXT, CSV, JSON, MD, RTF`
        );
        return false;
      }
      return true;
    });

    setAttachedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoiceResult = (transcript: string) => {
    setMessage((prev) => prev + (prev ? " " : "") + transcript);
    setIsRecording(false);
  };

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

  const commands = [
    { command: "/summary", description: "Create a meeting summary" },
    { command: "/actions", description: "Extract action items from meeting" },
    { command: "/email", description: "Generate stakeholder email" },
    { command: "/decisions", description: "Identify key decisions made" },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.command.toLowerCase().includes(message.toLowerCase())
  );

  return (
    <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      {/* Command Suggestions */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="border-b border-gray-200 p-2">
          <div className="space-y-1">
            {filteredCommands.map((cmd) => (
              <Button
                key={cmd.command}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => {
                  setMessage(cmd.command + " ");
                  setShowCommands(false);
                  textareaRef.current?.focus();
                }}
              >
                <Command className="w-4 h-4 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {cmd.command}
                  </div>
                  <div className="text-xs text-gray-600">{cmd.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="p-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm"
              >
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="truncate max-w-32">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area - Modern Chat Input Container */}
      <div className="relative max-w-2xl mx-auto w-full p-4">
        <form onSubmit={handleSend} className="relative">
          {/* Modern Chat Input Container */}
          <div className="relative bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-600 overflow-hidden">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-blue-500/[0.03] opacity-0 focus-within:opacity-100 transition-opacity duration-500"></div>

            {/* Text Input Area */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Upload meeting transcript or ask for summary..."
                disabled={disabled}
                className="relative w-full px-4 py-3 resize-none focus:outline-none bg-transparent text-black disabled:opacity-50 transition-all duration-200 text-base leading-relaxed min-h-[48px] auto-resize z-10 rounded-lg border-0 outline-0 ring-0 focus:border-0 focus:outline-0 focus:ring-0 placeholder-gray-400 sm:placeholder-transparent"
                rows={1}
              />
              {/* Desktop-only placeholder overlay */}
              {!message && (
                <div className="hidden sm:block absolute left-4 top-3 pointer-events-none text-base z-5 text-gray-400">
                  Ask about meeting summaries, action items, stakeholder emails,
                  or any meeting topic...
                </div>
              )}
            </div>

            {/* Controls Bar - No divider line */}
            <div className="relative flex items-center justify-between px-3 py-2 bg-transparent">
              {/* Left Side Controls */}
              <div className="flex items-center gap-2">
                {/* Paperclip - File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="group relative flex items-center justify-center w-8 h-8 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  title="Upload meeting files (TXT, CSV, JSON, MD)"
                >
                  <Paperclip className="w-4 h-4 group-hover:scale-105 transition-all duration-200" />
                  {attachedFiles.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">
                        {attachedFiles.length}
                      </span>
                    </div>
                  )}
                </button>

                {/* Model Selector */}
                {onModelChange && (
                  <div className="relative">
                    <button
                      type="button"
                      disabled={disabled}
                      className="group flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[rgba(155,167,255,0.3)] backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-2">
                        {/* Model Icon */}
                        <div className="relative w-5 h-5 rounded-lg overflow-hidden bg-white/90 flex items-center justify-center shadow-sm">
                          <img
                            src={
                              selectedModel === "claude"
                                ? "/images/claude-logo.jpg"
                                : "/images/chatgpt-logo.jpg"
                            }
                            alt={
                              selectedModel === "claude" ? "Claude" : "GPT"
                            }
                            className="w-4 h-4"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        </div>
                        {/* Model Name */}
                        <span className="text-sm font-medium text-white hidden sm:block">
                          {selectedModel === "claude"
                            ? "Claude 4.0"
                            : "Gemini 2.5"}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-white/70 transition-transform duration-200" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.md,.rtf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-2">
                {/* Voice Input */}
                <VoiceInput
                  onResult={handleVoiceResult}
                  onRecordingChange={setIsRecording}
                  disabled={disabled}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!message.trim() || isOverLimit || disabled}
                  className="group relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transform active:scale-95 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <Send className="w-4 h-4 group-hover:scale-105 transition-transform duration-200" />

                  {/* Subtle glow effect for active state */}
                  {message.trim() && !disabled && (
                    <div className="absolute inset-0 rounded-md bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Compact Footer info - Hidden on mobile */}
        <div className="hidden sm:flex items-center justify-center mt-3 text-xs text-gray-500">
          Powered by MeetingMind AI. Transform meeting chaos into actionable
          insights.
        </div>

        {/* Status Indicators */}
        {(isRecording || disabled) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            {isRecording && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Recording...
              </div>
            )}
            {disabled && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                AI is thinking...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
