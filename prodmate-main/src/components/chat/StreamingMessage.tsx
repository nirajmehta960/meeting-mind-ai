import React from 'react';
import { Bot } from 'lucide-react';
import { MessageContent } from './MessageContent';

interface StreamingMessageProps {
  content: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-sm flex-shrink-0">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
          <MessageContent content={content} />
          
          {/* Typing indicator */}
          <div className="flex items-center space-x-2 mt-4">
            <div className="w-2 h-4 bg-primary animate-pulse rounded-full" />
            <span className="text-xs text-muted-foreground">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};