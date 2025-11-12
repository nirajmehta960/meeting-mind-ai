import React from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { FeatureInterface } from "./FeatureInterface";
import { Navbar } from "../layout/Navbar";
import { useAppStore } from "../../stores/appStore";
import { Target, Users, BarChart3, TrendingUp, Sparkles } from "lucide-react";

export const ChatContainer: React.FC = () => {
  const { getCurrentConversation, selectedFeature } = useAppStore();
  const currentConversation = getCurrentConversation();

  // Show feature interface if a feature is selected
  if (selectedFeature) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex-1 mt-16">
          <FeatureInterface featureId={selectedFeature} />
        </div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
        <Navbar />

        {/* Welcome Screen - Fixed height, no scroll */}
        <div className="flex-1 flex items-center justify-center p-4 mt-16 overflow-hidden">
          <div className="text-center max-w-4xl w-full">
            <div className="mb-8">
              <h1 className="text-4xl sm:text-6xl mb-4 text-foreground font-be-vietnam-pro font-light tracking-tighter">
                stratifypm
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Your AI-powered product management assistant for strategic
                decisions, user research, and data-driven insights.
              </p>
            </div>

            {/* Feature Cards - Single line */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200/20 dark:border-blue-800/20 rounded-lg px-3 py-2 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 gradient-blue rounded-md flex items-center justify-center shadow-sm">
                    <Target className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Strategic Planning
                  </h3>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-200/20 dark:border-green-800/20 rounded-lg px-3 py-2 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 gradient-green rounded-md flex items-center justify-center shadow-sm">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-medium text-green-700 dark:text-green-300">
                    User Research
                  </h3>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-200/20 dark:border-orange-800/20 rounded-lg px-3 py-2 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 gradient-orange rounded-md flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-medium text-orange-700 dark:text-orange-300">
                    Data Analytics
                  </h3>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200/20 dark:border-blue-800/20 rounded-lg px-3 py-2 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 gradient-blue rounded-md flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Execution
                  </h3>
                </div>
              </div>
            </div>

            {/* Suggested Questions - compact on mobile, full on desktop */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
                <span className="text-xs sm:text-sm text-muted-foreground font-medium mr-2">
                  Try:
                </span>
                {[
                  "Create a competitive analysis framework",
                  "Help me prioritize features for Q1",
                  "Design a user research study",
                  "Build a KPI dashboard strategy",
                  "Analyze market trends and opportunities",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const event = new CustomEvent("setSuggestion", {
                        detail: suggestion,
                      });
                      window.dispatchEvent(event);
                    }}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-full border border-border hover:border-primary/30 transition-all duration-200 hover:scale-105 whitespace-nowrap ${index > 1 ? 'hidden sm:inline-flex' : ''}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-3 rounded-lg border border-primary/10 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-1">
                <Sparkles className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">
                  Ready to get started?
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ask me anything about product management, or drag & drop files
                to analyze data
              </p>
            </div>
          </div>
        </div>

        {/* Input at bottom - Fixed position */}
        <div className="flex-shrink-0">
          <MessageInput conversationId="" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex flex-col mt-16">
        <MessageList conversation={currentConversation} />
        <MessageInput conversationId={currentConversation.id} />
      </div>
    </div>
  );
};
