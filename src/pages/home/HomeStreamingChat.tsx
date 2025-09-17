import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import ChatComponent from '../../components/chat/ChatComponent';
import ChatList from '../../components/chat/ChatList';
import AIConfigPanel from '../../components/aiConfigPanel/AIConfigPanel';
import Header from '../../components/layout/Header';
import { useAuthContext } from '../../contexts/QueryAuthContext';

interface AIConfig {
  user_id: string;
  company_id: string;
  area: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
  top_k: number;
}

const HomeStreamingChat = () => {
  const { user } = useAuthContext();
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>();
  
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    user_id: user?.usuario || '',
    company_id: 'CIA00099',
    area: 'AREA001',
    similarity_threshold: 0.4,
    temperature: 0.3,
    max_tokens: 1024,
    top_k: 5,
  });

  // Update config when user data becomes available
  useEffect(() => {
    if (user) {
      const actualCompanyArea = (user as any)?.actual_company_area;
      setAiConfig(prevConfig => ({
        ...prevConfig,
        user_id: user.usuario,
        // For Admin role, use actual_company_area data
        ...(user.rol_nombre === 'Admin' && user.id_tipo_rol === 2 && actualCompanyArea && {
          company_id: actualCompanyArea.ID_EMPRESA || actualCompanyArea.EMPRESA || prevConfig.company_id,
          area: actualCompanyArea.ID_AREA || actualCompanyArea.AREA || prevConfig.area,
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
              <ChatComponent aiConfig={aiConfig} />
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
                    {aiConfig.company_id}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration Panel */}
            <AIConfigPanel
              config={aiConfig}
              onConfigChange={setAiConfig}
            />
          </div>
        </div>
    </div>
  );
};


export default HomeStreamingChat;