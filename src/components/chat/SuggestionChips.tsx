import { Button } from "@/components/ui/button";
import { FileText, CheckSquare, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  suggestions?: string[];
}

const defaultSuggestions = [
  {
    text: "Summarize Meeting",
    prompt:
      "I have a meeting transcript that I need summarized. Can you create a comprehensive summary with key decisions and discussion points?",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  },
  {
    text: "Extract Action Items",
    prompt:
      "I need to extract action items from this meeting transcript. Can you identify tasks, owners, and deadlines?",
    icon: CheckSquare,
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
  {
    text: "Generate Stakeholder Email",
    prompt:
      "I need to send a stakeholder update based on this meeting. Can you draft a professional email summarizing the key points?",
    icon: Mail,
    color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
  },
  {
    text: "Format Meeting Notes",
    prompt:
      "I have raw meeting notes that need to be organized and formatted. Can you structure them into a clear, professional format?",
    icon: Clock,
    color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
  },
];

export function SuggestionChips({
  onSelect,
  suggestions,
}: SuggestionChipsProps) {
  const chips = suggestions
    ? suggestions.map((text) => ({
        text,
        prompt: text,
        icon: FileText,
        color: "bg-primary/10 text-primary hover:bg-primary/20",
      }))
    : defaultSuggestions;

  return (
    <div className="p-4 border-b border-border/50">
      <div className="mb-2">
        <p className="text-xs text-muted-foreground font-medium">Quick Start</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => onSelect(chip.prompt)}
              className={cn(
                "h-auto px-3 py-2 text-xs font-medium transition-all duration-200",
                "border border-border/50 hover:border-transparent",
                "hover:scale-105 hover:shadow-sm",
                chip.color
              )}
            >
              <Icon className="w-3 h-3 mr-2" />
              {chip.text}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
