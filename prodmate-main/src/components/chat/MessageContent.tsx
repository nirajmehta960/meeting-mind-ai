import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../../hooks/useTheme";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const { isDark } = useTheme();

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code
                className={`${className} bg-muted px-1.5 py-0.5 rounded text-sm font-mono`}
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-border shadow-sm">
                <table className="min-w-full divide-y divide-border">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/50">{children}</thead>;
          },
          tbody({ children }) {
            return (
              <tbody className="bg-background divide-y divide-border">
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-muted/30 transition-colors duration-150">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border">
                {children}
              </th>
            );
          },
          td({ children }) {
            // Convert <br> tags to actual line breaks
            const processContent = (content: any): any => {
              if (typeof content === "string") {
                return content
                  .split("<br>")
                  .map((part, index, array) =>
                    index < array.length - 1 ? [part, <br key={index} />] : part
                  )
                  .flat();
              }
              return content;
            };

            return (
              <td className="px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0 whitespace-pre-wrap">
                {Array.isArray(children)
                  ? children.map((child) => processContent(child))
                  : processContent(children)}
              </td>
            );
          },
          h1({ children }) {
            return (
              <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0 leading-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl font-bold text-foreground mb-3 mt-5 first:mt-0 leading-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0 leading-tight">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0 leading-tight">
                {children}
              </h4>
            );
          },
          p({ children }) {
            return (
              <p className="text-foreground leading-relaxed mb-4 last:mb-0">
                {children}
              </p>
            );
          },
          strong({ children }) {
            return (
              <strong
                className="font-bold text-foreground"
                style={{ fontWeight: 700 }}
              >
                {children}
              </strong>
            );
          },
          em({ children }) {
            return <em className="italic text-foreground">{children}</em>;
          },
          ul({ children }) {
            return <ul className="mb-4 space-y-2 pl-0">{children}</ul>;
          },
          ol({ children }) {
            return (
              <ol
                className="mb-4 space-y-2 pl-0"
                style={{ counterReset: "list-counter" }}
              >
                {children}
              </ol>
            );
          },
          li({ children }) {
            return (
              <li className="text-foreground leading-relaxed pl-6 relative">
                {children}
              </li>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 bg-muted/30 py-2 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-6 border-border" />;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
