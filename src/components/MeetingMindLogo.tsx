import { MessageSquare, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingMindLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function MeetingMindLogo({
  className,
  size = "md",
  showText = false,
}: MeetingMindLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md",
          sizeClasses[size]
        )}
      >
        <MessageSquare
          className={cn("text-white", iconSize[size])}
          strokeWidth={2.5}
        />
        <Brain
          className={cn(
            "absolute -bottom-0.5 -right-0.5 text-white bg-blue-700 rounded-full p-0.5",
            size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-3.5 h-3.5"
          )}
          strokeWidth={2}
        />
      </div>
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          MeetingMind
        </span>
      )}
    </div>
  );
}
