import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ChatStateContextType {
  selectedChatId: number | undefined;
  isStreaming: boolean;
  onChatSelect: (chatId: number) => void;
  onNewChat: () => void;
  setSelectedChatId: (chatId: number | undefined) => void;
  setIsStreaming: (streaming: boolean) => void;
  setHandlers?: (handlers: { onChatSelect: (chatId: number) => void; onNewChat: () => void }) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

export const ChatStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const handlersRef = useRef<{
    onChatSelect: (chatId: number) => void;
    onNewChat: () => void;
  } | null>(null);

  const onChatSelect = useCallback((chatId: number) => {
    setSelectedChatId(chatId);
    handlersRef.current?.onChatSelect(chatId);
  }, []);

  const onNewChat = useCallback(() => {
    setSelectedChatId(undefined);
    handlersRef.current?.onNewChat();
  }, []);

  const value: ChatStateContextType = {
    selectedChatId,
    isStreaming,
    onChatSelect,
    onNewChat,
    setSelectedChatId,
    setIsStreaming,
    setHandlers: (newHandlers) => {
      handlersRef.current = newHandlers;
    },
  };

  return (
    <ChatStateContext.Provider value={value}>
      {children}
    </ChatStateContext.Provider>
  );
};

export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error('useChatState must be used within ChatStateProvider');
  }
  return context;
};
