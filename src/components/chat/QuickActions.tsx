import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  FileText,
  Target,
  TrendingUp,
  Search,
  CheckSquare,
  Mail,
  Clock,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  command: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

interface QuickActionsProps {
  onCommand: (command: string) => void;
  onClose: () => void;
}

const commands: Command[] = [
  {
    id: "summary",
    command: "/summary",
    title: "Meeting Summary",
    description:
      "Create a comprehensive summary of meeting discussions and decisions",
    icon: FileText,
    category: "Meeting Analysis",
  },
  {
    id: "actions",
    command: "/actions",
    title: "Action Items",
    description: "Extract and organize action items with owners and deadlines",
    icon: CheckSquare,
    category: "Meeting Analysis",
  },
  {
    id: "email",
    command: "/email",
    title: "Stakeholder Email",
    description: "Generate professional stakeholder update emails",
    icon: Mail,
    category: "Communication",
  },
  {
    id: "decisions",
    command: "/decisions",
    title: "Key Decisions",
    description:
      "Identify and highlight important decisions made in the meeting",
    icon: Target,
    category: "Meeting Analysis",
  },
  {
    id: "followup",
    command: "/followup",
    title: "Follow-up Plan",
    description: "Create a structured follow-up plan with next steps",
    icon: TrendingUp,
    category: "Planning",
  },
  {
    id: "notes",
    command: "/notes",
    title: "Meeting Notes",
    description: "Format and organize raw meeting notes into structured format",
    icon: FileText,
    category: "Meeting Analysis",
  },
  {
    id: "timeline",
    command: "/timeline",
    title: "Project Timeline",
    description: "Update project timelines based on meeting decisions",
    icon: Clock,
    category: "Planning",
  },
  {
    id: "recap",
    command: "/recap",
    title: "Meeting Recap",
    description: "Generate a quick recap for team members who couldn't attend",
    icon: MessageSquare,
    category: "Communication",
  },
];

export function QuickActions({ onCommand, onClose }: QuickActionsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.command.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(filteredCommands.map((cmd) => cmd.category))];

  const handleCommandSelect = (command: string) => {
    onCommand(command);
    onClose();
  };

  return (
    <div className="border-b border-border/50 bg-muted/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Quick Actions</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search commands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Commands */}
      <ScrollArea className="max-h-80">
        <div className="p-4 pt-2 space-y-4">
          {categories.map((category) => {
            const categoryCommands = filteredCommands.filter(
              (cmd) => cmd.category === category
            );
            if (categoryCommands.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {categoryCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <Button
                        key={cmd.id}
                        variant="ghost"
                        onClick={() => handleCommandSelect(cmd.command)}
                        className={cn(
                          "w-full justify-start text-left h-auto p-3 rounded-lg",
                          "hover:bg-primary/5 hover:border-primary/20 border border-transparent",
                          "transition-all duration-200 hover:scale-[1.02]"
                        )}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {cmd.title}
                              </span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {cmd.command}
                              </code>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {cmd.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="text-center py-8">
              <Command className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No commands found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for summary, actions, or email
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-muted/5">
        <p className="text-xs text-muted-foreground">
          💡 Tip: Type "/" in the message box to see meeting commands inline
        </p>
      </div>
    </div>
  );
}
