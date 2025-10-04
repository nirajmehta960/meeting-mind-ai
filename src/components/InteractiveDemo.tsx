import { useState, useEffect } from "react";
import { Brain, Send } from "lucide-react";

const demoMessages = [
  {
    type: "user" as const,
    text: "Can you summarize this meeting transcript and create action items?",
  },
  {
    type: "assistant" as const,
    text: "I'll analyze the meeting transcript and extract key points, decisions, and action items for you:",
  },
  {
    type: "assistant" as const,
    text: `# Meeting Summary: Q4 Product Planning

## Key Decisions Made
• Prioritize user authentication feature for Q4
• Extend timeline for mobile app by 2 weeks
• Allocate additional resources to customer support team

## Discussion Points
• User feedback indicates need for better onboarding
• Technical debt is impacting development velocity
• Marketing team needs clearer product positioning

## Action Items
• **Sarah (PM)**: Draft PRD for auth feature by Friday
• **Mike (Dev Lead)**: Create technical roadmap for mobile app
• **Lisa (Marketing)**: Develop new positioning strategy
• **Team**: Schedule follow-up meeting next Tuesday

## Next Steps
• Review action items in next team sync
• Update project timeline based on decisions
• Prepare stakeholder update for leadership team

Would you like me to draft a stakeholder email based on this summary?`,
  },
];

export default function InteractiveDemo() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentMessage < demoMessages.length) {
      const message = demoMessages[currentMessage];
      setIsTyping(true);
      setDisplayedText("");

      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < message.text.length) {
          setDisplayedText(message.text.slice(0, charIndex + 1));
          charIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);

          // Move to next message after a pause
          setTimeout(() => {
            if (currentMessage < demoMessages.length - 1) {
              setCurrentMessage(currentMessage + 1);
            } else {
              // Reset demo after completion
              setTimeout(() => {
                setCurrentMessage(0);
              }, 3000);
            }
          }, 1500);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [currentMessage]);

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 scroll-fade">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            See <span className="gradient-text">AI in Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch how our AI transforms meeting transcripts into actionable
            summaries and follow-up tasks. Try it yourself in the chat below!
          </p>
        </div>

        <div className="glass-card hover-glow scroll-fade">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-6 border-b border-white/10">
            <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Product Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Online • Ready to help
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-6 space-y-6 min-h-96">
            {demoMessages.slice(0, currentMessage + 1).map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "glass mr-12"
                  }`}
                >
                  {index === currentMessage ? (
                    <div className="whitespace-pre-wrap">
                      {displayedText}
                      {isTyping && <span className="animate-pulse">|</span>}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.text}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center gap-3 glass rounded-xl p-3">
              <input
                type="text"
                placeholder="Upload meeting transcript or ask for summary..."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                disabled
              />
              <button className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
