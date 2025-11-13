export type AIModel = "gemini" | "claude";

export interface ModelOption {
  id: AIModel;
  name: string;
  fullName: string;
  icon: string;
  color: string;
}

export const modelOptions: ModelOption[] = [
  {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    fullName: "Claude 3.5 Sonnet",
    icon: "/images/claude-logo.jpg",
    color: "#FF7A00",
  },
  {
    id: "gemini",
    name: "GPT-4o Mini",
    fullName: "GPT-4o Mini",
    icon: "/images/chatgpt-logo.jpg",
    color: "#10A37F",
  },
];
