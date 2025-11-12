import React, { useEffect } from 'react';
import { ChatContainer } from './components/chat/ChatContainer';
import { useTheme } from './hooks/useTheme';

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    // Apply theme class to document root
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-all duration-500 w-full overflow-x-hidden">
      <ChatContainer />
    </div>
  );
}

export default App;