import React, { useState } from 'react';
import { Plus, Sun, Moon, MessageSquare, X, Trash2, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../stores/appStore';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { 
    createConversation, 
    setSelectedFeature, 
    conversations, 
    deleteConversation,
    clearAllConversations,
    setCurrentConversation,
    currentConversationId
  } = useAppStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  const handleNewChat = () => {
    setSelectedFeature(null);
    const newId = createConversation();
    setShowHistory(false);
  };

  const handleConversationClick = (conversationId: string) => {
    setCurrentConversation(conversationId);
    setSelectedFeature(null);
    setShowHistory(false);
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(conversationId);
    setShowDeleteMenu(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      clearAllConversations();
      setShowDeleteMenu(null);
    }
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-30 flex justify-between items-center p-3 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 transition-colors duration-200 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 group transition-all hover:scale-105 flex items-center gap-2 px-3 py-2 text-sm font-medium shadow-sm"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-all" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tighter text-foreground font-be-vietnam-pro">
            stratifypm
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg transition-all flex items-center gap-2 px-3 py-2 text-sm font-medium ${
              showHistory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent hover:bg-accent/80 text-accent-foreground'
            }`}
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">History</span>
            {conversations.length > 0 && (
              <span className="bg-primary-foreground text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {conversations.length}
              </span>
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent hover:bg-accent/80 transition-all text-muted-foreground hover:text-foreground"
          >
            {theme === 'light' ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-50 shadow-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Chat History</h2>
                {conversations.length > 0 && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                    {conversations.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {conversations.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Clear all conversations"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto h-full pb-20">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
                  <p className="text-xs text-muted-foreground">Start a new conversation to see it here</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                        currentConversationId === conversation.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:bg-accent/50 hover:border-accent-foreground/20'
                      }`}
                      onClick={() => handleConversationClick(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate mb-1">
                            {conversation.title}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{conversation.messages.length} messages</span>
                            <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteMenu(showDeleteMenu === conversation.id ? null : conversation.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-all ml-2"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      {/* Delete menu */}
                      {showDeleteMenu === conversation.id && (
                        <div className="absolute right-1 top-8 bg-popover border border-border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
                          <button
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 rounded-md"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};