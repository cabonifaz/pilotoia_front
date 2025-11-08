import { Outlet, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ChatStateProvider } from '../../contexts/ChatStateContext';

const ProtectedLayout = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isRagRoute = pathname === '/rag';

  const handleStreamingStateChange = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
  }, []);

    return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header
        isStreaming={isStreaming}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 overflow-hidden flex min-h-0">
        {isRagRoute ? (
          <ChatStateProvider>
            <>
              <Sidebar
                isStreaming={isStreaming}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
              {isMobileMenuOpen && (
                <div
                  className="fixed inset-0 z-30 bg-black/50 md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              <div className="flex-1 overflow-hidden min-h-0 bg-background min-w-0">
                <Outlet
                  context={{
                    onStreamingStateChange: handleStreamingStateChange,
                  }}
                />
              </div>
            </>
          </ChatStateProvider>
        ) : (
          <>
            <Sidebar
              isStreaming={isStreaming}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            {isMobileMenuOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            <div className="flex-1 overflow-hidden min-h-0 bg-background min-w-0">
              <Outlet
                context={{
                  onStreamingStateChange: handleStreamingStateChange,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProtectedLayout;
