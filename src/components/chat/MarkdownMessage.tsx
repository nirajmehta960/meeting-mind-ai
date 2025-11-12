import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy, Download, RefreshCw, Square, Mail, CheckSquare, Target, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MarkdownMessageProps {
  content: string;
  onCopy?: () => void;
  onDownload?: () => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  copied?: boolean;
  isLoading?: boolean;
  isLast?: boolean;
  modelName?: string;
  responseTime?: number;
}

export function MarkdownMessage({
  content,
  onCopy,
  onDownload,
  onRegenerate,
  onStop,
  copied = false,
  isLoading = false,
  isLast = false,
  modelName,
  responseTime,
}: MarkdownMessageProps) {
  const { theme } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);

  // Detect content type
  const hasActionItems = /(?:action items?|tasks?|todo|follow.?up)/i.test(content) && /(?:•|[-*]|\[ ?\])/i.test(content);
  const hasEmail = /(?:subject|to:|from:|dear|regards)/i.test(content) && /@/.test(content);
  const hasCode = /```/.test(content);
  const hasSummary = /(?:summary|key points|decisions|next steps)/i.test(content);

  // Calculate stats
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
  const codeBlockCount = (content.match(/```/g) || []).length / 2;

  // Copy code block
  const handleCopyCode = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlock(`${language}-${code.substring(0, 20)}`);
    setTimeout(() => setCopiedCodeBlock(null), 2000);
  };

  // Download message
  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meetingmind-summary-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  // Extract action items
  const extractActionItems = () => {
    const lines = content.split("\n");
    const actionItems: string[] = [];
    let inActionSection = false;

    for (const line of lines) {
      if (/(?:action items?|tasks?|todo|follow.?up)/i.test(line)) {
        inActionSection = true;
        continue;
      }
      if (inActionSection && /(?:•|[-*]|\[ ?\])/.test(line)) {
        actionItems.push(line.trim());
      }
      if (inActionSection && line.trim() === "" && actionItems.length > 0) {
        break;
      }
    }

    return actionItems.join("\n") || content;
  };

  // Extract email content
  const extractEmail = () => {
    const subjectMatch = content.match(/subject:?\s*(.+)/i);
    const toMatch = content.match(/to:?\s*(.+)/i);
    const bodyMatch = content.match(/(?:body|message|content):?\s*([\s\S]+)/i);

    if (subjectMatch || toMatch || bodyMatch) {
      return content;
    }
    return content;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Message Stats */}
      {wordCount > 100 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 px-1">
          <span>~{wordCount} words</span>
          <span>•</span>
          <span>{readingTime} min read</span>
          {modelName && (
            <>
              <span>•</span>
              <span>{modelName}</span>
            </>
          )}
          {responseTime && (
            <>
              <span>•</span>
              <span>Generated in {responseTime.toFixed(1)}s</span>
            </>
          )}
        </div>
      )}

      {/* Action Buttons - Top Right */}
      {showActions && !isLoading && (
        <div className="absolute -top-8 right-0 flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-lg z-10">
          {onCopy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCopy}
                  className="h-7 px-2 text-xs"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy message</TooltipContent>
            </Tooltip>
          )}

          {onDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 px-2 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as text file</TooltipContent>
            </Tooltip>
          )}

          {hasActionItems && onCopy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const actionItems = extractActionItems();
                    navigator.clipboard.writeText(actionItems);
                    onCopy();
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Copy Actions
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy action items</TooltipContent>
            </Tooltip>
          )}

          {hasEmail && onCopy && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const email = extractEmail();
                    navigator.clipboard.writeText(email);
                    onCopy();
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Copy Email
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy email content</TooltipContent>
            </Tooltip>
          )}

          {isLast && onRegenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </TooltipTrigger>
              <TooltipContent>Regenerate response</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Stop Button */}
      {isLoading && onStop && (
        <div className="absolute -top-8 right-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="h-7 px-2 text-xs bg-card"
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
        </div>
      )}

      {/* Markdown Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headers
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-bold mt-5 mb-3 text-foreground" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />
            ),
            h4: ({ node, ...props }) => (
              <h4 className="text-base font-semibold mt-3 mb-2 text-foreground" {...props} />
            ),
            h5: ({ node, ...props }) => (
              <h5 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props} />
            ),
            h6: ({ node, ...props }) => (
              <h6 className="text-xs font-semibold mt-2 mb-1 text-foreground" {...props} />
            ),

            // Paragraphs
            p: ({ node, ...props }: any) => (
              <p className="mb-4 leading-relaxed text-foreground" {...props} />
            ),

            // Lists
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="leading-relaxed text-foreground" {...props} />
            ),

            // Code blocks
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const codeString = String(children).replace(/\n$/, "");

              if (!inline && language) {
                const showLineNumbers = codeString.split("\n").length > 10;
                const codeId = `${language}-${codeString.substring(0, 20)}`;
                const isCopied = copiedCodeBlock === codeId;

                return (
                  <div className="relative my-4 group">
                    <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-2 rounded-t-lg border-b border-gray-700">
                      <span className="text-xs text-gray-400 uppercase">{language}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(codeString, language)}
                        className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={theme === "dark" ? vscDarkPlus : github}
                      showLineNumbers={showLineNumbers}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0 0 0.5rem 0.5rem",
                        fontSize: "0.875rem",
                        padding: "1rem",
                        backgroundColor: theme === "dark" ? "#1e1e1e" : "#f6f8fa",
                      }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              // Inline code
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            },

            // Blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
                {...props}
              />
            ),

            // Tables
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-border" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-muted" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody className="[&>tr:nth-child(even)]:bg-muted/50" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="border-b border-border" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="border border-border px-4 py-2 text-left font-semibold text-foreground" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-border px-4 py-2 text-foreground" {...props} />
            ),

            // Links
            a: ({ node, ...props }: any) => (
              <a
                className="text-[#19C37D] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),

            // Horizontal rules
            hr: ({ node, ...props }) => (
              <hr className="my-6 border-border" {...props} />
            ),

            // Strong/Bold
            strong: ({ node, ...props }) => (
              <strong className="font-semibold text-foreground" {...props} />
            ),

            // Emphasis/Italic
            em: ({ node, ...props }) => (
              <em className="italic text-foreground" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        {isLoading && content && (
          <span className="inline-block w-2 h-4 bg-primary ml-1 animate-cursor-blink align-middle" />
        )}
      </div>
    </div>
  );
}

