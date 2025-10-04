import React from "react";
import { MessageSquare } from "lucide-react";
import { MessageContent } from "./MessageContent";

interface StreamingMessageProps {
  content: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
}) => {
  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-[rgba(38,44,90,0.6)] border border-[rgba(107,129,255,0.2)] flex items-center justify-center shadow-sm flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-[#9ba7ff]" />
      </div>

      <div className="flex-1 max-w-3xl">
        <div className="bg-[rgba(38,44,90,0.6)] border border-[rgba(112,127,255,0.25)] rounded-2xl px-4 py-3 shadow-sm">
          <MessageContent content={content} />

          {/* Typing indicator */}
          <div className="flex items-center space-x-2 mt-4">
            <div className="w-2 h-4 bg-[#9ba7ff] animate-pulse rounded-full" />
            <span className="text-xs text-[#9ba7ff]">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
