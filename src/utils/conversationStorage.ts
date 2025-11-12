import type { Conversation, ChatMessage } from "@/components/chat/ChatInterface";

const STORAGE_KEY = "meetingmind_conversations";
const ACTIVE_CONVERSATION_KEY = "meetingmind_active_conversation_id";

// Helper to serialize dates
const serializeConversation = (conv: Conversation): any => ({
  ...conv,
  createdAt: conv.createdAt.toISOString(),
  updatedAt: conv.updatedAt.toISOString(),
  messages: conv.messages.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp.toISOString(),
  })),
});

// Helper to deserialize dates
const deserializeConversation = (data: any): Conversation => ({
  ...data,
  createdAt: new Date(data.createdAt),
  updatedAt: new Date(data.updatedAt),
  messages: data.messages.map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  })),
});

export const conversationStorage = {
  // Load all conversations from localStorage
  loadConversations(): Conversation[] {
    if (typeof window === "undefined") return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return data.map(deserializeConversation);
    } catch (error) {
      console.error("Error loading conversations:", error);
      return [];
    }
  },

  // Save all conversations to localStorage
  saveConversations(conversations: Conversation[]): void {
    if (typeof window === "undefined") return;
    
    try {
      const serialized = conversations.map(serializeConversation);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error("Error saving conversations:", error);
    }
  },

  // Get active conversation ID
  getActiveConversationId(): string | null {
    if (typeof window === "undefined") return null;
    
    try {
      return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    } catch (error) {
      console.error("Error loading active conversation ID:", error);
      return null;
    }
  },

  // Set active conversation ID
  setActiveConversationId(id: string | null): void {
    if (typeof window === "undefined") return;
    
    try {
      if (id) {
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
      }
    } catch (error) {
      console.error("Error saving active conversation ID:", error);
    }
  },

  // Clear all conversations
  clearConversations(): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    } catch (error) {
      console.error("Error clearing conversations:", error);
    }
  },
};

// Helper to format relative time
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older dates, show actual date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

