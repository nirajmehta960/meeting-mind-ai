import React, { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { MessageContent } from './MessageContent';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };





  if (isUser) {
    return (
      <div className="flex items-start space-x-4 mb-8 justify-end px-4">
        <div className="flex-1 max-w-2xl">
          <div className="group relative">
            <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-sm ml-auto max-w-fit">
              <MessageContent content={message.content} />
            </div>
            
            <div className="absolute -right-2 top-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/95 backdrop-blur-sm rounded-md border border-border flex items-center shadow-sm hover:shadow-md">
              <button
                onClick={handleCopy}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Copy message"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4 mb-8 px-4">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-sm flex-shrink-0">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 max-w-2xl">
        <div className="group relative">
          <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
            <MessageContent content={message.content} />
          </div>
          
          <div className="absolute -right-2 top-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/95 backdrop-blur-sm rounded-md border border-border flex items-center shadow-sm hover:shadow-md">
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Copy message"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};