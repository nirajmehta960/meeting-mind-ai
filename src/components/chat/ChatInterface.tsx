import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  MessageSquare,
  Paperclip,
  Send,
  X,
  Copy,
  RefreshCw,
  Moon,
  Sun,
  Menu,
  Mic,
  FileText,
  CheckSquare,
  Mail,
  Target,
  ChevronDown,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIModel } from "@/types/ai";
import { modelOptions } from "@/types/ai";
import { VoiceInput } from "./VoiceInput";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  openRouterService,
  type Message as OpenRouterMessage,
} from "@/services/openRouterService";
import { toast } from "sonner";
import {
  fileProcessor,
  type FileProcessResult,
  type ProcessingProgress,
  type FileType,
} from "@/services/fileProcessor";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { MarkdownMessage } from "./MarkdownMessage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  Trash2,
  Search,
  ClipboardList,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  conversationStorage,
  formatRelativeTime,
} from "@/utils/conversationStorage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplatesModal } from "./TemplatesModal";
import { sampleTranscript } from "@/data/sampleTranscript";
import { useDebounce } from "@/hooks/use-debounce";

export interface ProcessedFile {
  id: string;
  file: File;
  fileType: FileType;
  status: "processing" | "ready" | "error" | "cancelled";
  content?: string;
  characterCount?: number;
  pageCount?: number;
  error?: string;
  warning?: string;
  progress?: ProcessingProgress;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: Array<{
    name: string;
    size: number;
    type: string;
    content?: string;
    characterCount?: number;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("claude");
  const [isLoading, setIsLoading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(
    new Set()
  );
  // Sidebar state: true on desktop (>=768px), false on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  });
  const [isRecording, setIsRecording] = useState(false);

  const { theme, setTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>(
    {}
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [hoveredConversationId, setHoveredConversationId] = useState<
    string | null
  >(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [conversationToRename, setConversationToRename] = useState<
    string | null
  >(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [lastError, setLastError] = useState<{
    message: string;
    retry: () => void;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get active conversation
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const messages = activeConversation?.messages || [];

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadedConversations = conversationStorage.loadConversations();
    const activeId = conversationStorage.getActiveConversationId();

    if (loadedConversations.length > 0) {
      setConversations(loadedConversations);
      if (activeId && loadedConversations.find((c) => c.id === activeId)) {
        setActiveConversationId(activeId);
        conversationStorage.setActiveConversationId(activeId);
      } else {
        const firstId = loadedConversations[0].id;
        setActiveConversationId(firstId);
        conversationStorage.setActiveConversationId(firstId);
      }
    } else {
      // Create initial conversation if none exist
      const initialConv: Conversation = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations([initialConv]);
      setActiveConversationId(initialConv.id);
      conversationStorage.saveConversations([initialConv]);
      conversationStorage.setActiveConversationId(initialConv.id);
    }
  }, []);

  // Save conversations to localStorage whenever they change (debounced to avoid excessive writes)
  useEffect(() => {
    if (conversations.length > 0) {
      const timeoutId = setTimeout(() => {
        conversationStorage.saveConversations(conversations);
        if (activeConversationId) {
          conversationStorage.setActiveConversationId(activeConversationId);
        }
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [conversations, activeConversationId]);

  // Auto-save conversations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (conversations.length > 0) {
        conversationStorage.saveConversations(conversations);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [conversations]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return conversations;
    }
    const query = debouncedSearchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((msg) => msg.content.toLowerCase().includes(query))
    );
  }, [conversations, debouncedSearchQuery]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Auto-scroll when streaming (check content changes)
  useEffect(() => {
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        // Scroll on content updates during streaming
        scrollToBottom();
      }
    }
  }, [messages.map((m) => m.content).join(""), isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 5 * 24; // 5 lines * 24px line height
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
  }, [message]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Cmd/Ctrl + K: Focus search when in input, or new chat otherwise
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          } else {
            handleNewChat();
          }
        }
        return;
      }

      // Cmd/Ctrl + K: Focus search / New chat
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          handleNewChat();
        }
      }
      // Cmd/Ctrl + /: Focus input
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Cmd/Ctrl + U: Upload file
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      // Escape: Close modals or stop generation
      if (e.key === "Escape") {
        if (showTemplates) {
          setShowTemplates(false);
        } else if (showShortcuts) {
          setShowShortcuts(false);
        } else if (isLoading && abortController) {
          handleStopGeneration();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    processingFiles.size,
    showTemplates,
    showShortcuts,
    isLoading,
    abortController,
  ]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const handleNewChat = () => {
    // Check if current conversation has messages
    const currentConv = conversations.find(
      (c) => c.id === activeConversationId
    );
    const hasMessages = currentConv && currentConv.messages.length > 0;

    // Check if user wants to skip confirmation
    const skipConfirm = localStorage.getItem("skipNewChatConfirm") === "true";

    if (hasMessages && !skipConfirm) {
      setShowNewChatConfirm(true);
      return;
    }

    createNewChat();
  };

  const createNewChat = () => {
    // Save current conversation before switching
    if (conversations.length > 0) {
      conversationStorage.saveConversations(conversations);
    }

    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setMessage("");
    setProcessedFiles([]);
    setProcessingFiles(new Set());
    setShowNewChatConfirm(false);
    setSearchQuery(""); // Clear search when creating new chat
  };

  const handleLoadSampleTranscript = () => {
    setMessage(sampleTranscript);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSendMessage = async () => {
    // Check if we have any content or ready files
    const readyFiles = processedFiles.filter(
      (f) => f.status === "ready" && f.content
    );
    if (!message.trim() && readyFiles.length === 0) return;
    if (isLoading) return;

    // Check if files are still processing
    if (processingFiles.size > 0) {
      toast.error("Please wait for files to finish processing before sending.");
      return;
    }

    const conversationId = activeConversationId || conversations[0]?.id;
    if (!conversationId) {
      handleNewChat();
      return;
    }

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Build user content with file contents
    let userContent =
      message.trim() ||
      (readyFiles.length > 0 ? "Analyze the attached files" : "");
    const fileMetadata: Array<{
      name: string;
      size: number;
      type: string;
      content?: string;
      characterCount?: number;
    }> = [];

    if (readyFiles.length > 0) {
      try {
        for (const processedFile of readyFiles) {
          if (!processedFile.content) continue;

          fileMetadata.push({
            name: processedFile.file.name,
            size: processedFile.file.size,
            type: processedFile.file.type,
            content: processedFile.content,
            characterCount: processedFile.characterCount,
          });

          // Format file content for AI
          const fileContent = formatFileContentForAI(
            processedFile.file.name,
            processedFile.content,
            processedFile.file.size,
            processedFile.characterCount || 0
          );
          userContent += `\n\n${fileContent}`;
        }
      } catch (error) {
        console.error("Error preparing files:", error);
        toast.error(
          `Failed to prepare files: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setAbortController(null);
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
      files: fileMetadata.length > 0 ? fileMetadata : undefined,
    };

    // Update conversation with user message and auto-generate title
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          // Auto-generate title from first message if it's a new conversation
          let newTitle = conv.title;
          if (conv.messages.length === 0 && userMessage.content) {
            // Extract meaningful title from first message
            const content = userMessage.content
              .replace(/\[File content\].*\[\/File content\]/gs, "")
              .trim();
            if (content.length > 0) {
              // Take first 50 characters or first sentence
              const firstSentence = content.split(/[.!?]/)[0];
              newTitle =
                (firstSentence || content).slice(0, 50).trim() || "New Chat";
              if (
                newTitle.length < content.length &&
                !newTitle.endsWith("...")
              ) {
                newTitle += "...";
              }
            } else {
              newTitle = "Analyze files";
            }
          }
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
            title: newTitle,
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );

    setMessage("");
    setProcessedFiles([]);
    setProcessingFiles(new Set());
    setIsLoading(true);

    // Track response start time
    const responseStartTime = Date.now();

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessagePlaceholder: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, aiMessagePlaceholder],
              updatedAt: new Date(),
            }
          : conv
      )
    );

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Add current user message
      const apiMessages: OpenRouterMessage[] = [
        ...conversationHistory,
        {
          role: "user",
          content: userContent,
        },
      ];

      // Stream response
      await openRouterService.sendMessage(
        apiMessages,
        selectedModel,
        (chunk: string) => {
          // Update AI message with streaming content
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: conv.messages.map((msg) =>
                      msg.id === aiMessageId ? { ...msg, content: chunk } : msg
                    ),
                    updatedAt: new Date(),
                  }
                : conv
            )
          );
        },
        controller.signal
      );

      // Calculate and store response time
      const responseTime = (Date.now() - responseStartTime) / 1000;
      setResponseTimes((prev) => ({ ...prev, [aiMessageId]: responseTime }));

      // Clear any previous errors on success
      setLastError(null);

      setIsLoading(false);
      setAbortController(null);
    } catch (error) {
      setIsLoading(false);
      setAbortController(null);

      // Remove placeholder if error occurred
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.filter((msg) => msg.id !== aiMessageId),
                updatedAt: new Date(),
              }
            : conv
        )
      );

      if (error instanceof Error) {
        if (error.message.includes("aborted")) {
          // User canceled, don't show error
          return;
        }

        // Store error for retry functionality
        const errorMessage = error.message;
        let userMessage = "Something went wrong. Please try again.";

        if (errorMessage.includes("API key")) {
          userMessage =
            "Invalid API key. Please check your OpenRouter configuration.";
        } else if (errorMessage.includes("Rate limit")) {
          userMessage = "Rate limit reached. Please try again in a moment.";
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("timed out")
        ) {
          userMessage = "Request timed out. Please try again.";
        } else if (
          errorMessage.includes("connect") ||
          errorMessage.includes("internet")
        ) {
          userMessage = "Lost connection. Check your internet and try again.";
        } else {
          userMessage = errorMessage || userMessage;
        }

        // Store error with retry function
        setLastError({
          message: userMessage,
          retry: () => {
            setLastError(null);
            handleSendMessage();
          },
        });

        toast.error(userMessage);
      } else {
        setLastError({
          message: "Something went wrong. Please try again.",
          retry: () => {
            setLastError(null);
            handleSendMessage();
          },
        });
        toast.error("Something went wrong. Please try again.");
      }

      console.error("AI service error:", error);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  // Format file content for AI
  const formatFileContentForAI = (
    fileName: string,
    content: string,
    fileSize: number,
    characterCount: number
  ): string => {
    const fileSizeStr = fileProcessor.formatFileSize(fileSize);
    const charCountStr = fileProcessor.formatCharacterCount(characterCount);

    // Show warnings for large files
    let warning = "";
    if (characterCount > 100000) {
      warning =
        "\n⚠️ Very large transcript. The AI may miss details. Consider splitting into sections.\n";
    } else if (characterCount > 50000) {
      warning = "\n⚠️ Large transcript. Consider summarizing key sections.\n";
    }

    return `Attached File: ${fileName} (${fileSizeStr}, ${charCountStr})${warning}\n\n[File content]\n${content}\n[/File content]`;
  };

  // Process file asynchronously
  const processFile = async (file: File): Promise<void> => {
    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}-${file.name}`;
    const fileType = fileProcessor.detectFileType(file);

    // Validate file
    const validation = fileProcessor.validateFile(file);
    if (!validation.valid) {
      setProcessedFiles((prev) => [
        ...prev,
        {
          id: fileId,
          file,
          fileType,
          status: "error",
          error: validation.error,
        },
      ]);
      toast.error(validation.error || "Invalid file");
      return;
    }

    // Add file to processing list
    setProcessingFiles((prev) => new Set(prev).add(fileId));

    // Add file with processing status
    setProcessedFiles((prev) => [
      ...prev,
      {
        id: fileId,
        file,
        fileType,
        status: "processing",
        progress: { current: 0, total: 1, status: "Reading file..." },
      },
    ]);

    try {
      const result = await fileProcessor.processFile(file, (progress) => {
        setProcessedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
        );
      });

      if (result.error) {
        setProcessedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: result.error,
                  warning: result.warning,
                }
              : f
          )
        );
        toast.error(result.error);
      } else {
        // Show warnings
        if (result.warning) {
          toast.warning(result.warning);
        }

        // Show success for large files
        if (result.characterCount && result.characterCount > 50000) {
          toast.info(
            `File processed: ${fileProcessor.formatCharacterCount(
              result.characterCount
            )}`
          );
        }

        setProcessedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "ready",
                  content: result.content,
                  characterCount: result.characterCount,
                  pageCount: result.pageCount,
                  warning: result.warning,
                }
              : f
          )
        );
      }
    } catch (error) {
      console.error("File processing error:", error);
      setProcessedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
              }
            : f
        )
      );
      toast.error(
        `Failed to process file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Remove from processing list
      setProcessingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);

    // Process files sequentially to avoid overwhelming the browser
    for (const file of fileArray) {
      // File validation is handled in processFile
      await processFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setProcessedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file && file.status === "processing") {
        // Cancel processing if in progress
        setProcessingFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleVoiceResult = (transcript: string) => {
    setMessage((prev) => prev + (prev ? " " : "") + transcript);
    setIsRecording(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const regenerateResponse = async () => {
    if (!activeConversationId || messages.length === 0 || isLoading) return;

    // Remove last AI message if it exists
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "assistant") {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: conv.messages.filter(
                  (msg) => msg.id !== lastMessage.id
                ),
                updatedAt: new Date(),
              }
            : conv
        )
      );

      // Resend last user message
      const lastUserMessage = messages[messages.length - 2];
      if (lastUserMessage && lastUserMessage.role === "user") {
        // Create abort controller
        const controller = new AbortController();
        setAbortController(controller);

        setIsLoading(true);

        // Track response start time
        const responseStartTime = Date.now();

        // Create placeholder for AI response
        const aiMessageId = Date.now().toString();
        const aiMessagePlaceholder: ChatMessage = {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, aiMessagePlaceholder],
                  updatedAt: new Date(),
                }
              : conv
          )
        );

        try {
          // Prepare conversation history (excluding the removed AI message)
          const conversationHistory = messages.slice(0, -1).map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

          // Add last user message
          const apiMessages: OpenRouterMessage[] = [
            ...conversationHistory,
            {
              role: "user",
              content: lastUserMessage.content,
            },
          ];

          // Stream response
          await openRouterService.sendMessage(
            apiMessages,
            selectedModel,
            (chunk: string) => {
              // Update AI message with streaming content
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === activeConversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map((msg) =>
                          msg.id === aiMessageId
                            ? { ...msg, content: chunk }
                            : msg
                        ),
                        updatedAt: new Date(),
                      }
                    : conv
                )
              );
            },
            controller.signal
          );

          // Calculate and store response time
          const responseTime = (Date.now() - responseStartTime) / 1000;
          setResponseTimes((prev) => ({
            ...prev,
            [aiMessageId]: responseTime,
          }));

          setIsLoading(false);
          setAbortController(null);
        } catch (error) {
          setIsLoading(false);
          setAbortController(null);

          // Remove placeholder if error occurred
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: conv.messages.filter(
                      (msg) => msg.id !== aiMessageId
                    ),
                    updatedAt: new Date(),
                  }
                : conv
            )
          );

          if (error instanceof Error) {
            if (error.message.includes("aborted")) {
              return;
            }

            if (error.message.includes("API key")) {
              toast.error(
                "Invalid API key. Please check your OpenRouter configuration."
              );
            } else if (error.message.includes("Rate limit")) {
              toast.error("Rate limit reached. Please try again in a moment.");
            } else if (
              error.message.includes("timeout") ||
              error.message.includes("timed out")
            ) {
              toast.error("Request timed out. Please try again.");
            } else if (
              error.message.includes("connect") ||
              error.message.includes("internet")
            ) {
              toast.error(
                "Unable to connect. Please check your internet connection."
              );
            } else {
              toast.error(
                error.message || "Something went wrong. Please try again."
              );
            }
          } else {
            toast.error("Something went wrong. Please try again.");
          }

          console.error("AI service error:", error);
        }
      }
    }
  };

  const selectedModelOption = modelOptions.find((m) => m.id === selectedModel);

  // Ensure sidebar is open on desktop on mount and resize
  useEffect(() => {
    const ensureDesktopSidebar = () => {
      if (typeof window !== "undefined") {
        const isDesktop = window.innerWidth >= 768;
        // On desktop (>=768px), always keep sidebar open
        if (isDesktop) {
          setIsSidebarOpen(true);
        }
      }
    };

    // Set initial state
    ensureDesktopSidebar();

    // Listen for resize events
    window.addEventListener("resize", ensureDesktopSidebar);
    return () => window.removeEventListener("resize", ensureDesktopSidebar);
  }, []);

  return (
    <TooltipProvider>
      <div className="h-screen w-full flex bg-chat-bg text-foreground overflow-hidden relative">
        {/* Backdrop for mobile sidebar - only show on mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar - ChatGPT-style dark gray */}
        {/* Desktop: Always visible (260px, relative). Mobile: Toggleable (fixed when open, hidden when closed) */}
        <aside
          className={cn(
            "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 h-full w-[320px]",
            // Desktop (md and up): always visible with relative positioning
            "md:relative md:z-auto md:flex",
            // Mobile: fixed positioning when open, hidden when closed
            isSidebarOpen ? "fixed z-50 flex" : "hidden md:flex"
          )}
          aria-label="Conversation sidebar"
        >
          {/* New Chat Button */}
          <div className="p-3 border-b border-sidebar-border">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-sidebar-hover rounded"
                >
                  <X className="w-3 h-3 text-sidebar-foreground/50" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.length === 0 && debouncedSearchQuery ? (
              <div className="px-3 py-8 text-center text-sidebar-foreground/50 text-sm">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg transition-colors min-w-0",
                    activeConversationId === conv.id
                      ? "bg-sidebar-active"
                      : "hover:bg-sidebar-hover"
                  )}
                  onMouseEnter={() => setHoveredConversationId(conv.id)}
                  onMouseLeave={(e) => {
                    // Don't hide if dropdown is open or mouse is moving to dropdown menu
                    if (openDropdownId === conv.id) return;
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    if (
                      !relatedTarget ||
                      !relatedTarget.closest('[role="menu"]')
                    ) {
                      setHoveredConversationId(null);
                    }
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      // Close sidebar on mobile after selection
                      if (
                        typeof window !== "undefined" &&
                        window.innerWidth < 768
                      ) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activeConversationId === conv.id
                        ? "text-sidebar-foreground font-medium"
                        : "text-sidebar-foreground/80"
                    )}
                    title={conv.title}
                  >
                    <div className="truncate font-medium">{conv.title}</div>
                    <div className="text-xs text-sidebar-foreground/60 mt-0.5 truncate">
                      {formatRelativeTime(conv.updatedAt)}
                    </div>
                  </button>
                  <div className="flex-shrink-0">
                    {(hoveredConversationId === conv.id ||
                      openDropdownId === conv.id) && (
                      <DropdownMenu
                        open={openDropdownId === conv.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setOpenDropdownId(conv.id);
                          } else {
                            setOpenDropdownId(null);
                            // Small delay to allow menu item clicks to register
                            setTimeout(() => {
                              if (hoveredConversationId === conv.id) {
                                setHoveredConversationId(null);
                              }
                            }, 100);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                            className="p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-hover rounded transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToRename(conv.id);
                              setRenameTitle(conv.title);
                              setOpenDropdownId(null);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(conv.id);
                              setOpenDropdownId(null);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-chat-bg">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button - Only toggles on mobile (< 768px) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Only toggle on mobile devices
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 768
                  ) {
                    setIsSidebarOpen(!isSidebarOpen);
                  }
                  // On desktop, sidebar is always visible (button does nothing)
                }}
                className="hover:bg-muted flex-shrink-0 md:cursor-default"
                aria-label={
                  typeof window !== "undefined" && window.innerWidth >= 768
                    ? "Sidebar menu"
                    : "Toggle sidebar"
                }
                aria-expanded={isSidebarOpen}
                title={
                  typeof window !== "undefined" && window.innerWidth >= 768
                    ? "Sidebar (always visible)"
                    : "Toggle sidebar"
                }
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">
                MeetingMind
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <div className="relative" ref={modelDropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="gap-2"
                >
                  {selectedModelOption && (
                    <>
                      <img
                        src={selectedModelOption.icon}
                        alt={selectedModelOption.name}
                        className="w-4 h-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                      <span className="hidden sm:inline">
                        {selectedModelOption.name}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {showModelDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 min-w-[200px]">
                    {modelOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedModel(option.id);
                          setShowModelDropdown(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg",
                          option.id === selectedModel && "bg-primary/10"
                        )}
                      >
                        <img
                          src={option.icon}
                          alt={option.name}
                          className="w-4 h-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {option.name}
                        </span>
                        {option.id === selectedModel && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newTheme = theme === "dark" ? "light" : "dark";
                      setTheme(newTheme);
                      // Save to localStorage
                      localStorage.setItem("theme", newTheme);
                    }}
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              {/* Keyboard Shortcuts Help */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowShortcuts(true)}
                    aria-label="Keyboard shortcuts"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Keyboard shortcuts</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto bg-chat-bg flex justify-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {/* Drag Overlay */}
            {isDragOver && (
              <div className="fixed inset-0 bg-primary/20 border-4 border-dashed border-primary z-50 flex items-center justify-center">
                <div className="bg-card rounded-lg p-8 shadow-xl border border-border">
                  <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-xl font-semibold text-foreground">
                    Drop files here to upload
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {messages.length === 0 && !isLoading && (
              <div className="w-full max-w-[768px] px-6 py-8 mx-auto animate-fade-in">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    Transform Your Meetings into Action
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Upload a transcript or paste meeting notes to get started
                  </p>
                </div>

                {/* Quick Action Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {[
                    {
                      icon: FileText,
                      label: "📝 Summarize",
                      prompt:
                        "Summarize this meeting transcript with key points, decisions, and action items",
                    },
                    {
                      icon: CheckSquare,
                      label: "✅ Action Items",
                      prompt:
                        "Extract all action items with owners and deadlines in a clear list format",
                    },
                    {
                      icon: Mail,
                      label: "📧 Email Draft",
                      prompt:
                        "Draft a professional email summarizing this meeting for stakeholders",
                    },
                    {
                      icon: Target,
                      label: "🎯 Decisions",
                      prompt:
                        "What were the key decisions made and their context?",
                    },
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full hover:bg-muted hover:border-primary/50 transition-all duration-200 text-sm font-medium text-foreground shadow-sm hover:shadow-md"
                      >
                        <span>{action.label.split(" ")[0]}</span>
                        <span className="hidden sm:inline">
                          {action.label.split(" ").slice(1).join(" ")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Try with Example Transcript */}
                <div className="text-center mb-8">
                  <Button
                    variant="outline"
                    onClick={handleLoadSampleTranscript}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Try with example transcript
                  </Button>
                </div>

                {/* Example Prompts */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                    Or try these examples:
                  </p>
                  {[
                    "Summarize my meeting transcript",
                    "Extract action items from discussion",
                    "Draft stakeholder email",
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(prompt)}
                      className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-card rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="w-full max-w-[768px] px-6 py-8">
              {messages.map((msg, index) => (
                <div key={msg.id} className="mb-6 last:mb-0">
                  <MessageBubble
                    message={msg}
                    isLast={index === messages.length - 1}
                    onCopy={() => copyToClipboard(msg.content, msg.id)}
                    onRegenerate={regenerateResponse}
                    copied={copiedMessageId === msg.id}
                    selectedModel={selectedModel}
                    isLoading={
                      isLoading &&
                      index === messages.length - 1 &&
                      msg.role === "assistant"
                    }
                    onStop={
                      isLoading &&
                      index === messages.length - 1 &&
                      msg.role === "assistant"
                        ? handleStopGeneration
                        : undefined
                    }
                    responseTime={responseTimes[msg.id]}
                  />
                </div>
              ))}
            </div>

            {/* Error State with Retry */}
            {lastError && messages.length > 0 && !isLoading && (
              <div className="w-full max-w-[768px] px-6 py-8 mx-auto">
                <div
                  className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in"
                  role="alert"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-3">
                        {lastError.message}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={lastError.retry}
                        className="bg-white dark:bg-card hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                        aria-label="Retry sending message"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-chat-bg flex justify-center px-6 py-4">
            <div className="w-full max-w-[768px]">
              {/* File Preview Cards */}
              {processedFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                  {processedFiles.map((processedFile) => (
                    <FilePreviewCard
                      key={processedFile.id}
                      processedFile={processedFile}
                      onRemove={() => removeFile(processedFile.id)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              )}

              {/* Input Container - ChatGPT-style rounded input */}
              <div className="relative bg-card border border-border rounded-[24px] shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-lg">
                <div className="flex items-end gap-2 px-4 py-3">
                  {/* File Attachment */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || processingFiles.size > 0}
                        className="flex-shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {processingFiles.size > 0 ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Paperclip className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {processingFiles.size > 0
                        ? "Processing files..."
                        : "Attach file (Ctrl/Cmd + U)"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Textarea */}
                  <div className="flex-1 relative min-w-0">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={
                        processingFiles.size > 0
                          ? "Processing files..."
                          : "Paste meeting transcript or ask a question..."
                      }
                      disabled={isLoading || processingFiles.size > 0}
                      className="min-h-[52px] max-h-[200px] resize-none pr-16 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground text-foreground py-3 px-4 disabled:opacity-50"
                      rows={1}
                    />
                    {message.length > 0 && (
                      <div className="absolute bottom-2 right-2 flex items-center pointer-events-none">
                        <span className="text-xs text-muted-foreground/70">
                          {message.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Templates Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowTemplates(true)}
                        disabled={isLoading || processingFiles.size > 0}
                        className="flex-shrink-0 h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Prompt templates</TooltipContent>
                  </Tooltip>

                  {/* Voice Input & Send Button */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <VoiceInput
                            onResult={handleVoiceResult}
                            onRecordingChange={setIsRecording}
                            disabled={isLoading}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Voice input</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSendMessage}
                          disabled={
                            (!message.trim() &&
                              processedFiles.filter((f) => f.status === "ready")
                                .length === 0) ||
                            isLoading ||
                            processingFiles.size > 0
                          }
                          className="flex-shrink-0 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-0"
                          size="icon"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send message (Enter)</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-xs text-muted-foreground text-center">
                  Shift + Enter for new line • Cmd/Ctrl + K to search • Cmd/Ctrl
                  + U to upload file
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.md,.doc"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* New Chat Confirmation Dialog */}
        <Dialog open={showNewChatConfirm} onOpenChange={setShowNewChatConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new chat?</DialogTitle>
              <DialogDescription>
                Current conversation will be cleared. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <Checkbox
                id="skip-confirm"
                checked={skipConfirm}
                onCheckedChange={(checked) => {
                  setSkipConfirm(checked === true);
                  if (checked) {
                    localStorage.setItem("skipNewChatConfirm", "true");
                  } else {
                    localStorage.removeItem("skipNewChatConfirm");
                  }
                }}
              />
              <Label
                htmlFor="skip-confirm"
                className="text-sm font-normal cursor-pointer"
              >
                Don't ask again
              </Label>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewChatConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  createNewChat();
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Start New
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Conversation Confirmation */}
        <Dialog
          open={conversationToDelete !== null}
          onOpenChange={(open) => !open && setConversationToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this conversation?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All messages in this conversation
                will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConversationToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (conversationToDelete) {
                    setConversations((prev) => {
                      const filtered = prev.filter(
                        (c) => c.id !== conversationToDelete
                      );
                      // Save to localStorage
                      conversationStorage.saveConversations(filtered);
                      return filtered;
                    });

                    if (activeConversationId === conversationToDelete) {
                      const remaining = conversations.filter(
                        (c) => c.id !== conversationToDelete
                      );
                      if (remaining.length > 0) {
                        setActiveConversationId(remaining[0].id);
                        conversationStorage.setActiveConversationId(
                          remaining[0].id
                        );
                      } else {
                        createNewChat();
                      }
                    }
                    setConversationToDelete(null);
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Conversation Dialog */}
        <Dialog
          open={conversationToRename !== null}
          onOpenChange={(open) => !open && setConversationToRename(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename conversation</DialogTitle>
              <DialogDescription>
                Enter a new name for this conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Conversation name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (conversationToRename && renameTitle.trim()) {
                      setConversations((prev) => {
                        const updated = prev.map((c) =>
                          c.id === conversationToRename
                            ? { ...c, title: renameTitle.trim() }
                            : c
                        );
                        conversationStorage.saveConversations(updated);
                        return updated;
                      });
                      setConversationToRename(null);
                      setRenameTitle("");
                    }
                  } else if (e.key === "Escape") {
                    setConversationToRename(null);
                    setRenameTitle("");
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConversationToRename(null);
                  setRenameTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (conversationToRename && renameTitle.trim()) {
                    setConversations((prev) => {
                      const updated = prev.map((c) =>
                        c.id === conversationToRename
                          ? { ...c, title: renameTitle.trim() }
                          : c
                      );
                      conversationStorage.saveConversations(updated);
                      return updated;
                    });
                    setConversationToRename(null);
                    setRenameTitle("");
                  }
                }}
                disabled={!renameTitle.trim()}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keyboard Shortcuts Guide */}
        <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Speed up your workflow with these keyboard shortcuts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {[
                { keys: "⌘/Ctrl + K", action: "New chat / Focus search" },
                { keys: "⌘/Ctrl + /", action: "Focus input" },
                { keys: "⌘/Ctrl + U", action: "Upload file" },
                { keys: "Enter", action: "Send message" },
                { keys: "Shift + Enter", action: "New line" },
                { keys: "Esc", action: "Cancel / Stop generation" },
              ].map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-foreground">
                    {shortcut.action}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowShortcuts(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Templates Modal */}
        <TemplatesModal
          open={showTemplates}
          onOpenChange={setShowTemplates}
          onSelectTemplate={(prompt) => {
            setMessage(prompt);
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 0);
          }}
        />
      </div>
    </TooltipProvider>
  );
}

// File Preview Card Component
interface FilePreviewCardProps {
  processedFile: ProcessedFile;
  onRemove: () => void;
  disabled?: boolean;
}

function FilePreviewCard({
  processedFile,
  onRemove,
  disabled,
}: FilePreviewCardProps) {
  const {
    file,
    fileType,
    status,
    content,
    characterCount,
    pageCount,
    error,
    warning,
    progress,
  } = processedFile;
  const fileSize = fileProcessor.formatFileSize(file.size);
  const fileTypeColor = fileProcessor.getFileTypeColor(fileType);
  const FileIcon = FileText;

  // Get status icon and color
  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case "ready":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case "processing":
        return progress?.status || "Processing...";
      case "ready":
        if (characterCount) {
          const charCountStr =
            fileProcessor.formatCharacterCount(characterCount);
          return `✓ Ready - ${charCountStr}`;
        }
        return "✓ Ready";
      case "error":
        return error || "Error";
      default:
        return "";
    }
  };

  // Calculate progress percentage
  const progressPercentage = progress
    ? progress.total > 0
      ? (progress.current / progress.total) * 100
      : 0
    : 0;

  return (
    <div
      className={cn(
        "relative bg-card border rounded-lg p-3 shadow-sm transition-all",
        status === "error" && "border-red-200 bg-red-50/50 dark:bg-red-950/20",
        status === "ready" &&
          "border-green-200 bg-green-50/50 dark:bg-green-950/20",
        status === "processing" && "border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className={cn("flex-shrink-0 mt-0.5", fileTypeColor)}>
          <FileIcon className="w-5 h-5" />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          {/* File Name and Size */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {fileSize}
              </span>
            </div>
            <button
              onClick={onRemove}
              disabled={disabled || status === "processing"}
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <span
              className={cn(
                "text-xs",
                status === "processing" && "text-primary",
                status === "ready" && "text-green-600",
                status === "error" && "text-red-600",
                status !== "processing" &&
                  status !== "ready" &&
                  status !== "error" &&
                  "text-muted-foreground"
              )}
            >
              {getStatusText()}
            </span>
          </div>

          {/* Progress Bar */}
          {status === "processing" && progress && progress.total > 0 && (
            <div className="mb-2">
              <Progress value={progressPercentage} className="h-2" />
              {progress.total > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Page {progress.current} of {progress.total}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {status === "error" && error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}

          {/* Warning */}
          {warning && status === "ready" && (
            <p className="text-xs text-yellow-600 mt-1">⚠ {warning}</p>
          )}

          {/* Page Count */}
          {pageCount && status === "ready" && (
            <p className="text-xs text-muted-foreground mt-1">
              {pageCount} page{pageCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  copied: boolean;
  selectedModel: AIModel;
  isLoading?: boolean;
  onStop?: () => void;
  responseTime?: number;
}

function MessageBubble({
  message,
  isLast,
  onCopy,
  onRegenerate,
  copied,
  selectedModel,
  isLoading = false,
  onStop,
  responseTime,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  if (message.role === "user") {
    return (
      <div
        className="flex items-start justify-end gap-4 w-full animate-fade-in"
        role="article"
        aria-label="User message"
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-chat-message-user flex items-center justify-center flex-shrink-0"
          aria-label="User avatar"
        >
          <span
            className="text-chat-text-user text-sm font-semibold"
            aria-hidden="true"
          >
            U
          </span>
        </div>

        <div className="flex flex-col items-end gap-2 flex-1 min-w-0">
          {/* Files */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {message.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg text-sm border border-primary/20"
                  title={`${file.name} (${fileProcessor.formatFileSize(
                    file.size
                  )})`}
                >
                  <FileText
                    className="w-4 h-4 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-foreground">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Message - ChatGPT-style blue */}
          <div
            className="bg-chat-message-user text-chat-text-user rounded-[18px] px-4 py-3 shadow-sm max-w-[80%] transition-shadow hover:shadow-md"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>

          {/* Timestamp */}
          <span
            className="text-xs text-muted-foreground"
            aria-label={`Sent at ${message.timestamp.toLocaleTimeString()}`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 w-full animate-fade-in"
      role="article"
      aria-label="AI assistant message"
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full bg-chat-message-ai flex items-center justify-center flex-shrink-0"
        aria-label="AI assistant avatar"
      >
        <MessageSquare
          className="w-4 h-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 min-w-0 -ml-12">
        <div
          className="bg-chat-message-ai rounded-[18px] px-5 py-4 shadow-sm border border-border w-full"
          onMouseEnter={() => !isLoading && setShowActions(true)}
          onMouseLeave={() => !isLoading && setShowActions(false)}
        >
          {message.content ? (
            <MarkdownMessage
              content={message.content}
              onCopy={onCopy}
              onDownload={() => {
                const timestamp = new Date()
                  .toISOString()
                  .replace(/[:.]/g, "-");
                const blob = new Blob([message.content], {
                  type: "text/plain",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `meetingmind-summary-${timestamp}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              onRegenerate={isLast ? onRegenerate : undefined}
              onStop={isLoading ? onStop : undefined}
              copied={copied}
              isLoading={isLoading}
              isLast={isLast}
              modelName={
                selectedModel === "claude" ? "Claude 3.5 Sonnet" : "GPT-4o Mini"
              }
              responseTime={responseTime}
            />
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingDots />
              <span>
                {selectedModel === "claude"
                  ? "Claude is analyzing..."
                  : "GPT is processing..."}
              </span>
            </div>
          ) : null}
        </div>

        {/* Timestamp */}
        {!isLoading && (
          <span className="text-xs text-muted-foreground mt-1 block">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// Loading Dots Component
function LoadingDots() {
  return (
    <div className="flex gap-1" aria-label="Loading" role="status">
      <div
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"
        aria-hidden="true"
      ></div>
      <div
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"
        aria-hidden="true"
      ></div>
      <div
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        aria-hidden="true"
      ></div>
    </div>
  );
}
