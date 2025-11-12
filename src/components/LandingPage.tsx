import { useState, useRef, useEffect } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  CheckSquare,
  Mail,
  Clock,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { VoiceInput } from "@/components/chat/VoiceInput";
import type { AIModel } from "@/types/ai";
import { cn } from "@/lib/utils";
import { modelOptions } from "@/types/ai";

export default function LandingPage() {
  const [showChat, setShowChat] = useState(false);

  // If chat is active, show ChatInterface
  if (showChat) {
    return <ChatInterface />;
  }

  // Otherwise show landing page that transitions to chat
  return <LandingPageContent onStartChat={() => setShowChat(true)} />;
}

interface LandingPageContentProps {
  onStartChat: () => void;
}

function LandingPageContent({ onStartChat }: LandingPageContentProps) {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("claude");
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelDropdown]);

  const handleSend = () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    // Transition to chat interface
    onStartChat();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/json",
      "text/markdown",
      "application/rtf",
    ];

    const validFiles = files.filter((file) => {
      if (file.size > 50 * 1024 * 1024) {
        return false;
      }
      return allowedTypes.includes(file.type);
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

  const handleExampleClick = (prompt: string) => {
    setMessage(prompt);
    setTimeout(() => {
      textareaRef.current?.focus();
      // Auto-transition to chat after a brief moment
      setTimeout(() => {
        onStartChat();
      }, 100);
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const examplePrompts = [
    "Summarize my meeting transcript",
    "Extract action items from discussion",
    "Draft stakeholder email",
    "Identify key decisions",
    "Generate follow-up plan",
  ];

  const selectedModelOption = modelOptions.find((m) => m.id === selectedModel);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-white">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-2 md:py-4 overflow-hidden">
        <div className="flex flex-col items-center max-w-5xl w-full space-y-4 md:space-y-5">
            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight text-center">
              MeetingMind
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl text-center leading-relaxed px-4">
              Transform meeting chaos into actionable insights. Get instant
              summaries, extract action items, and generate stakeholder emails
              with AI precision.
            </p>

          {/* Feature Badges */}
          <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 flex-wrap px-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-900">
                Smart Summaries
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <CheckSquare className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-900">
                Action Items
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-900">
                Email Drafts
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-900">
                Follow-ups
              </span>
            </div>
          </div>

          {/* Try Section */}
          <div className="w-full max-w-4xl px-4">
            <p className="text-xs md:text-sm font-medium text-gray-700 mb-2 text-center">
              Try:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-3 py-1.5 md:py-2 text-xs md:text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Help Box */}
          <div className="w-full max-w-4xl px-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 shadow-sm">
              <p className="text-xs md:text-sm font-semibold text-blue-900 mb-1">
                Ready to get started?
              </p>
              <p className="text-xs md:text-sm text-blue-700">
                Ask me anything about your meetings, or drag & drop files to
                analyze
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white/98 backdrop-blur-sm py-4 md:py-5">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs md:text-sm border border-gray-200"
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 flex-shrink-0" />
                  <span className="truncate max-w-32 md:max-w-40 text-gray-700">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-1"
                  >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Container */}
          <div
            className={cn(
              "relative bg-white rounded-xl md:rounded-2xl border-2 transition-all duration-300",
              isInputFocused || message
                ? "border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.01]"
                : "border-gray-200 shadow-lg hover:border-gray-300 hover:shadow-xl"
            )}
          >
            <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3">
              {/* Left Side - File Attachment & Model Selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Model Selector - Inside Input */}
                <div className="relative flex-shrink-0 hidden sm:block" ref={modelDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-xs md:text-sm"
                  >
                    {selectedModelOption && (
                      <>
                        <img
                          src={selectedModelOption.icon}
                          alt={selectedModelOption.name}
                          className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                        <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap hidden md:inline">
                          {selectedModelOption.name}
                        </span>
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap md:hidden">
                          Claude
                        </span>
                      </>
                    )}
                  </button>

                  {/* Model Dropdown */}
                  {showModelDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                      {modelOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedModel(option.id);
                            setShowModelDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                            option.id === selectedModel && "bg-blue-50"
                          )}
                        >
                          <img
                            src={option.icon}
                            alt={option.name}
                            className="w-4 h-4 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {option.name}
                          </span>
                          {option.id === selectedModel && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <div className="flex-1 min-w-0">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="Ask about meeting summaries, action items, stakeholder emails, or any meeting topic..."
                  className="min-h-[48px] md:min-h-[52px] max-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base bg-transparent px-0 py-2 placeholder:text-gray-400 text-gray-900"
                  rows={1}
                />
              </div>

              {/* Right Side - Mic & Send */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <VoiceInput
                  onResult={handleVoiceResult}
                  onRecordingChange={setIsRecording}
                  disabled={false}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() && attachedFiles.length === 0}
                  className="flex-shrink-0 p-2 md:p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 disabled:hover:bg-gray-300 shadow-sm hover:shadow-md"
                  title="Send message"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-3 md:mt-4">
            Powered by MeetingMind AI. Transform meeting chaos into actionable
            insights.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,.rtf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
