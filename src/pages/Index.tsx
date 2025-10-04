import HeroSection from "@/components/HeroSection";
import ChatWidget from "@/components/chat/ChatWidget";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect } from "react";

const Index = () => {
  useScrollAnimation();

  useEffect(() => {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <ChatWidget isEmbedded={true} useMeetingChat={true} />
    </div>
  );
};

export default Index;
