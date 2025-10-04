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
    name: "Claude 4.0 Sonnet",
    fullName: "Claude 4.0 Sonnet",
    icon: "/claude-color.svg",
    color: "#FF7A00",
  },
  {
    id: "gemini",
    name: "Gemini 2.5 Flash",
    fullName: "Gemini 2.5 Flash",
    icon: "/gemini-color.svg",
    color: "#4285F4",
  },
];
