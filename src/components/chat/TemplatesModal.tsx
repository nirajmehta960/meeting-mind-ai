import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckSquare,
  Mail,
  Target,
  Clock,
  Briefcase,
  Users,
  ListChecks,
} from "lucide-react";

export interface Template {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const templates: Template[] = [
  // Meeting Summaries
  {
    id: "quick-summary",
    category: "Meeting Summaries",
    title: "Quick Summary",
    description: "Concise 3-paragraph summary with key takeaways",
    prompt: "Provide a concise 3-paragraph summary with key takeaways from this meeting.",
    icon: FileText,
  },
  {
    id: "detailed-summary",
    category: "Meeting Summaries",
    title: "Detailed Summary",
    description: "Comprehensive analysis of the meeting",
    prompt: "Give me a comprehensive analysis of this meeting, including all key points, discussions, and outcomes.",
    icon: FileText,
  },
  {
    id: "executive-brief",
    category: "Meeting Summaries",
    title: "Executive Brief",
    description: "Brief executive summary (max 200 words)",
    prompt: "Create a brief executive summary (max 200 words) highlighting the most important points from this meeting.",
    icon: Briefcase,
  },
  // Action & Tasks
  {
    id: "action-items",
    category: "Action & Tasks",
    title: "Action Items",
    description: "Extract all action items with owners and deadlines",
    prompt: "Extract all action items with owners and deadlines from this meeting. Format them clearly with due dates.",
    icon: CheckSquare,
  },
  {
    id: "decision-log",
    category: "Action & Tasks",
    title: "Decision Log",
    description: "Key decisions made and why",
    prompt: "What key decisions were made in this meeting and why? Provide context for each decision.",
    icon: ListChecks,
  },
  {
    id: "follow-up-plan",
    category: "Action & Tasks",
    title: "Follow-up Plan",
    description: "Structured follow-up plan with timeline",
    prompt: "Create a structured follow-up plan with timeline based on this meeting. Include next steps and deadlines.",
    icon: Clock,
  },
  // Email Drafts
  {
    id: "stakeholder-update",
    category: "Email Drafts",
    title: "Stakeholder Update",
    description: "Professional email for stakeholders",
    prompt: "Draft a professional email for stakeholders summarizing this meeting. Include key points and next steps.",
    icon: Mail,
  },
  {
    id: "team-update",
    category: "Email Drafts",
    title: "Team Update",
    description: "Casual team update email",
    prompt: "Write a casual team update email based on this meeting. Keep it friendly and informative.",
    icon: Users,
  },
  {
    id: "action-items-email",
    category: "Email Drafts",
    title: "Action Items Email",
    description: "Format action items as an email",
    prompt: "Format the action items from this meeting as a clear, professional email that can be sent to the team.",
    icon: Mail,
  },
];

interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (prompt: string) => void;
}

export function TemplatesModal({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplatesModalProps) {
  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prompt Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly get started with your meeting analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories.map((category) => {
            const categoryTemplates = templates.filter(
              (t) => t.category === category
            );
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          onSelectTemplate(template.prompt);
                          onOpenChange(false);
                        }}
                        className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg hover:bg-muted hover:border-primary/50 transition-all duration-200 text-left group"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className="w-5 h-5 text-primary group-hover:text-primary/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground mb-1">
                            {template.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {template.description}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplate(template.prompt);
                              onOpenChange(false);
                            }}
                          >
                            Use Template
                          </Button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

