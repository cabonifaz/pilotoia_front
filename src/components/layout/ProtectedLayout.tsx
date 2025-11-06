import { Outlet, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ChatStateProvider } from '../../contexts/ChatStateContext';

const ProtectedLayout = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const { pathname } = useLocation();
  const isRagRoute = pathname === '/rag';

  const handleStreamingStateChange = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
  }, []);

  return (
  <div className="h-screen bg-background flex flex-col">
    <Header isStreaming={isStreaming} />

    <div className="flex-1 overflow-hidden flex min-h-0">
      {isRagRoute ? (
        <ChatStateProvider>
          <Sidebar isStreaming={isStreaming} />

          <div className="flex-1 overflow-hidden min-h-0 bg-background">
            <Outlet context={{
              onStreamingStateChange: handleStreamingStateChange,
            }} />
          </div>
        </ChatStateProvider>
      ) : (
        <>
          <Sidebar isStreaming={isStreaming} />

          <div className="flex-1 overflow-hidden min-h-0 bg-background">
            <Outlet context={{
              onStreamingStateChange: handleStreamingStateChange,
            }} />
          </div>
        </>
      )}
    </div>
  </div>
);
};

export default ProtectedLayout;
