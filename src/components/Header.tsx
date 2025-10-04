import { Brain, LogIn } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-black">MeetingMind</span>
        </div>

        {/* Navigation Links - Removed for cleaner design */}

        {/* Login Button */}
        <div className="flex items-center">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-black hover:bg-gray-50 transition-colors duration-200 font-medium">
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
        </div>
      </div>
    </header>
  );
}
