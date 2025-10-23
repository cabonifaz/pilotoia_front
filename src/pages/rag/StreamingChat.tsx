import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import ChatComponent from '../../components/chat/ChatComponent';
import ChatList from '../../components/chat/ChatList';
import AIConfigPanel from '../../components/aiConfigPanel/AIConfigPanel';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { type AIConfig, type ChatContext } from '@/types/aiConfig';

const StreamingChat = () => {
  const { user } = useQueryAuthContext();
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const chatSelectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    similarity_threshold: 0.65,
    alpha: 0.75,
    temperature: 0.3,
    max_tokens: 4096,
    top_k: 20,
  });

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
          id_ia_area: actualCompanyArea.ID_IA_AREA,
          chat_id: savedChatId ? parseInt(savedChatId) : null,
        };

        setChatContext(newChatContext);

        // Update selectedChatId state if there's a saved chat_id
        if (savedChatId) {
          setSelectedChatId(parseInt(savedChatId));
        }
      }

      // Update AI config if actualCompanyArea has AI parameters
      if (actualCompanyArea) {
        setAiConfig(prevConfig => ({
          ...prevConfig,
          ...(actualCompanyArea.RAG_SIMILARITY_THRESHOLD !== undefined && { similarity_threshold: actualCompanyArea.RAG_SIMILARITY_THRESHOLD }),
          ...(actualCompanyArea.RAG_ALPHA !== undefined && { alpha: actualCompanyArea.RAG_ALPHA }),
          ...(actualCompanyArea.LLM_TEMPERATURE !== undefined && { temperature: actualCompanyArea.LLM_TEMPERATURE }),
          ...(actualCompanyArea.LLM_MAX_TOKENS !== undefined && { max_tokens: actualCompanyArea.LLM_MAX_TOKENS }),
          ...(actualCompanyArea.RAG_TOP_K_RESULTS !== undefined && { top_k: actualCompanyArea.RAG_TOP_K_RESULTS }),
        }));
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
  }, []);

  const handleNewChat = () => {
    setSelectedChatId(undefined);
    // Clear chat_id from sessionStorage when starting a new chat
    sessionStorage.removeItem('current_chat_id');
    // Update chatContext to have null chat_id
    setChatContext(prev => prev ? { ...prev, chat_id: null } : null);
  };

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
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (chatSelectTimeoutRef.current) {
        clearTimeout(chatSelectTimeoutRef.current);
      }
    };
  }, []);

  if (!chatContext) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-lg">Cargando configuración...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-8 p-8 h-full">
      {/* Chat Section - 70% width */}
      <div className="flex-1 lg:w-[70%] flex flex-col gap-4 min-h-0 overflow-hidden">
        <h1 className="text-3xl font-bold text-foreground">Piloto IA</h1>
        <div className="flex-1 bg-background rounded-lg min-h-0 overflow-hidden">
          <ChatComponent
            aiConfig={aiConfig}
            chatContext={chatContext}
            onChatIdChange={handleChatIdChange}
            onStreamingStateChange={handleStreamingStateChange}
          />
        </div>
      </div>

      {/* Right Sidebar - 30% width */}
      <div className="lg:w-[30%] flex-shrink-0 space-y-4 overflow-y-auto min-h-0">
        {/* Chat List */}
        <ChatList
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          selectedChatId={selectedChatId}
          isDisabled={isStreaming}
        />

        {/* Company Info */}
        <Card className="bg-muted/50 border shadow-sm">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                {chatContext.company} • {chatContext.area}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration Panel - Only show for SuperAdmin and Admin */}
        {user?.id_tipo_rol !== 3 && (
          <AIConfigPanel
            config={aiConfig}
            chatContext={chatContext}
            onConfigChange={setAiConfig}
            onChatContextChange={setChatContext}
          />
        )}
      </div>
    </div>
  );
};


export default StreamingChat;