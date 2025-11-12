import React, { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { useAppStore } from '../../stores/appStore';
import type { Conversation } from '../../types';

interface MessageListProps {
  conversation: Conversation;
}

export const MessageList: React.FC<MessageListProps> = ({ conversation }) => {
  const { getConversationState } = useAppStore();
  const { isLoading, streamingMessage } = getConversationState(conversation.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, streamingMessage, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto bg-background scrollbar-thin" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
        {conversation.messages.length === 0 && !isLoading && !streamingMessage ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Start the conversation! Ask me anything about product management.
            </p>
          </div>
        ) : (
          <>
            {conversation.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {streamingMessage && (
              <StreamingMessage content={streamingMessage} />
            )}
            
            {isLoading && !streamingMessage && (
              <div className="flex items-start space-x-4 mb-8 px-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};