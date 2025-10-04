import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-[#f5f5f5] mb-3 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2 mt-4 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-[#f5f5f5] mb-2 mt-3 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[#f5f5f5] mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[#f5f5f5] mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[#f5f5f5] mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-[#f5f5f5]">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#f5f5f5]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#f5f5f5]">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-[rgba(50,57,242,0.1)] text-[#9ba7ff] px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-[rgba(50,57,242,0.1)] border border-[rgba(107,129,255,0.2)] rounded-lg p-3 overflow-x-auto mb-3">
              <code className="text-[#f5f5f5] text-sm font-mono">
                {children}
              </code>
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#9ba7ff] pl-4 italic text-[#9ba7ff] mb-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-[rgba(107,129,255,0.2)]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[rgba(50,57,242,0.1)]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-[rgba(107,129,255,0.2)] px-3 py-2 text-left text-[#f5f5f5] font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[rgba(107,129,255,0.2)] px-3 py-2 text-[#f5f5f5]">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
