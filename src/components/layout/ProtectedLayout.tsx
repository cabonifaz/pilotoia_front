import { Outlet } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Header from './Header';

const ProtectedLayout = () => {
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStreamingStateChange = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
  }, []);

  return (
    <div className="h-screen bg-muted/30 flex flex-col">
      <Header isStreaming={isStreaming} />
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ onStreamingStateChange: handleStreamingStateChange }} />
      </div>
    </div>
  );
};

export default ProtectedLayout;
