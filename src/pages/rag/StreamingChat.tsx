import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/shadcn/button';
import { Settings } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import ChatComponent from '../../components/chat/ChatComponent';
import { AIConfigSidebar } from '../../components/aiConfigPanel/AIConfigSidebar';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { useChatState } from '../../contexts/ChatStateContext';
import { type ChatContext } from '@/types/aiConfig';
import { Loader } from '@/components/loader/Loader';

const StreamingChat = () => {
  const { user } = useQueryAuthContext();
  const { onStreamingStateChange } = useOutletContext<any>();
  const { setSelectedChatId, setIsStreaming, setHandlers } = useChatState();
  const chatSelectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConfigSidebarOpen, setIsConfigSidebarOpen] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const previousCompanyAreaRef = useRef<string | null>(null);

  // Update context and config when user data becomes available
  useEffect(() => {
    if (user) {
      const actualCompanyArea = (user as any)?.actual_company_area;

      // Only set context if we have valid data
      if (actualCompanyArea && user.user_id) {
        // Create a unique key for the current company/area combination
        const currentCompanyAreaKey = `${actualCompanyArea.ID_EMPRESA}-${actualCompanyArea.ID_AREA}`;

        // Check if company/area has changed
        if (previousCompanyAreaRef.current && previousCompanyAreaRef.current !== currentCompanyAreaKey) {
          // Clear chat_id from sessionStorage when company/area changes
          sessionStorage.removeItem('current_chat_id');
          setSelectedChatId(undefined);
          setIsConfigSidebarOpen(false);
        }

        // Update the ref with the current company/area
        previousCompanyAreaRef.current = currentCompanyAreaKey;

        // Check if there's a saved chat_id in sessionStorage (only if company/area hasn't changed)
        const savedChatId = sessionStorage.getItem('current_chat_id');

        const newChatContext = {
          user_id: user.user_id,
          user: user.user,
          company_id: actualCompanyArea.ID_EMPRESA,
          company: actualCompanyArea.EMPRESA,
          area_id: actualCompanyArea.ID_AREA,
          area: actualCompanyArea.AREA,
          chat_id: savedChatId ? parseInt(savedChatId) : null,
        };

        setChatContext(newChatContext);

        // Update selectedChatId state if there's a saved chat_id
        if (savedChatId) {
          setSelectedChatId(parseInt(savedChatId));
        }
      }
    }
  }, [user]);

  const handleChatSelect = useCallback((chatId: number) => {
    // Immediately update selected chat ID for UI feedback (visual selection)
    setSelectedChatId(chatId);

    // Clear any pending chat change timeout
    if (chatSelectTimeoutRef.current) {
      clearTimeout(chatSelectTimeoutRef.current);
    }

    // Wait 500ms before actually changing the chat (loading messages, etc.)
    // This prevents rapid backend calls if user is quickly clicking through chats
    chatSelectTimeoutRef.current = setTimeout(() => {
      sessionStorage.setItem('current_chat_id', chatId.toString());
      setChatContext(prev => prev ? { ...prev, chat_id: chatId } : null);
    }, 500);
  }, [setSelectedChatId]);

  const handleNewChat = useCallback(() => {
    setSelectedChatId(undefined);
    // Clear chat_id from sessionStorage when starting a new chat
    sessionStorage.removeItem('current_chat_id');
    // Update chatContext to have null chat_id
    setChatContext(prev => prev ? { ...prev, chat_id: null } : null);
  }, [setSelectedChatId]);

  const handleChatIdChange = useCallback((chatId: number) => {
    // Update chatContext with the new chat_id
    setChatContext(prev => prev ? { ...prev, chat_id: chatId } : null);
    // Save chat_id to sessionStorage
    sessionStorage.setItem('current_chat_id', chatId.toString());
    // Update selected chat to show the newly created chat as selected
    setSelectedChatId(chatId);
  }, []);

  const handleStreamingStateChange = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
    onStreamingStateChange(streaming);
  }, [onStreamingStateChange, setIsStreaming]);

  // Register handlers with context
  useEffect(() => {
    setHandlers?.({
      onChatSelect: handleChatSelect,
      onNewChat: handleNewChat,
    });
  }, [handleChatSelect, handleNewChat, setHandlers]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (chatSelectTimeoutRef.current) {
        clearTimeout(chatSelectTimeoutRef.current);
      }
    };
  }, []);

  if (!chatContext) {
    return <Loader text="Cargando configuración..." />;
  }

  return (
    <div className="flex justify-center p-4 md:py-6 md:px-0 h-full overflow-hidden min-h-0">
      <div className="w-full md:max-w-4xl h-full flex flex-col">
        <div className="relative flex flex-1 overflow-hidden min-h-0 h-full">
          {/* Main Content */}
          <div
            className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 min-h-0`}
          >


            {/* Chat Section */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
              <div className="flex-1 rounded-lg overflow-hidden min-h-0 h-full">
                <ChatComponent
                  chatContext={chatContext}
                  onChatIdChange={handleChatIdChange}
                  onStreamingStateChange={handleStreamingStateChange}
                />
              </div>
            </div>
          </div>

          {/* Settings Button */}
          <div className="fixed top-20 right-4 z-10">
            {user?.id_tipo_rol == 1 && !isConfigSidebarOpen && (
              <Button
                onClick={() => setIsConfigSidebarOpen(true)}
                variant="ghost"
                size="icon"
                className="rounded-full"
                title="Configuración"
              >
                <Settings className="h-5 w-5 text-primary" />
              </Button>
            )}
          </div>

          {/* Right Sidebar - Config Panel */}
          {user?.id_tipo_rol == 1 && chatContext && isConfigSidebarOpen && (
            <AIConfigSidebar
              isOpen={isConfigSidebarOpen}
              onClose={() => setIsConfigSidebarOpen(false)}
              id_empresa={chatContext.company_id}
              id_area={chatContext.area_id}
            />
          )}
        </div>
      </div>
    </div>
  );
};


export default StreamingChat;