import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import ChatComponent from '../../components/chat/ChatComponent';
import ChatList from '../../components/chat/ChatList';
import AIConfigPanel from '../../components/aiConfigPanel/AIConfigPanel';
import Header from '../../components/layout/Header';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { type AIConfig } from '@/types/aiConfig';

const HomeStreamingChat = () => {
  const { user } = useQueryAuthContext();
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>();
  
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    user_id: user?.usuario || '',
    company_id: 'COM1',
    area: 'AREA2',
    similarity_threshold: 0.65,
    alpha: 0.75,
    temperature: 0.3,
    max_tokens: 4096,
    top_k: 20,
  });

  // Update config when user data becomes available
  useEffect(() => {
    if (user) {
      const actualCompanyArea = (user as any)?.actual_company_area;
      setAiConfig(prevConfig => ({
        ...prevConfig,
        user_id: user.usuario,
        // For all users, use actual_company_area data if available
        ...(actualCompanyArea && {
          company_id: actualCompanyArea.EMPRESA || prevConfig.company_id,
          area: actualCompanyArea.AREA || prevConfig.area,
          // Include AI parameters if they exist in actualCompanyArea
          ...(actualCompanyArea.RAG_SIMILARITY_THRESHOLD !== undefined && { similarity_threshold: actualCompanyArea.RAG_SIMILARITY_THRESHOLD }),
          ...(actualCompanyArea.RAG_ALPHA !== undefined && { alpha: actualCompanyArea.RAG_ALPHA }),
          ...(actualCompanyArea.LLM_TEMPERATURE !== undefined && { temperature: actualCompanyArea.LLM_TEMPERATURE }),
          ...(actualCompanyArea.LLM_MAX_TOKENS !== undefined && { max_tokens: actualCompanyArea.LLM_MAX_TOKENS }),
          ...(actualCompanyArea.RAG_TOP_K_RESULTS !== undefined && { top_k: actualCompanyArea.RAG_TOP_K_RESULTS }),
        }),
      }));
    }
  }, [user]);

  const handleChatSelect = (chatId: number) => {
    setSelectedChatId(chatId);
    console.log('Selected chat:', chatId);
    // Here you can load specific chat messages or context
  };

  const handleNewChat = () => {
    setSelectedChatId(undefined);
    console.log('Creating new chat...');
    // Here you can create a new chat or reset the current conversation
  };


  return (
    <div className="h-screen bg-muted/30 flex flex-col">
      <Header />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-8 p-8">
          {/* Chat Section - 70% width */}
          <div className="flex-1 lg:w-[70%] flex flex-col gap-4 min-h-0">
            <h1 className="text-3xl font-bold text-foreground">Piloto IA</h1>
            <div className="flex-1 bg-background rounded-lg min-h-0">
              <ChatComponent
                aiConfig={aiConfig}
                idIaArea={(user as any)?.actual_company_area?.ID_IA_AREA || 0}
              />
            </div>
          </div>

          {/* Right Sidebar - 30% width */}
          <div className="lg:w-[30%] flex-shrink-0 space-y-4 overflow-y-auto">
            {/* Chat List */}
            <ChatList
              onChatSelect={handleChatSelect}
              onNewChat={handleNewChat}
              selectedChatId={selectedChatId}
            />

            {/* Company Info */}
            <Card className="bg-muted/50 border shadow-sm">
              <CardContent className="pt-3 pb-3">
                <div className="text-center">
                  <Badge variant="secondary" className="text-sm">
                    {aiConfig.company_id} • {aiConfig.area}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration Panel - Only show for SuperAdmin and Admin */}
            {user?.id_tipo_rol !== 3 && (
              <AIConfigPanel
                config={aiConfig}
                onConfigChange={setAiConfig}
              />
            )}
          </div>
        </div>
    </div>
  );
};


export default HomeStreamingChat;