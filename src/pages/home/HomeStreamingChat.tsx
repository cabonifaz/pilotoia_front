import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import ChatComponent from '../../components/chat/ChatComponent';
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
  
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    user_id: user?.usuario || '',
    company_id: 'CIA00001',
    area: '',
    similarity_threshold: 0.4,
    temperature: 0.3,
    max_tokens: 1024,
    top_k: 5,
  });

  // Update config when user data becomes available
  useEffect(() => {
    if (user) {
      setAiConfig(prevConfig => ({
        ...prevConfig,
        user_id: user.usuario,
      }));
    }
  }, [user]);


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
            {/* AI Image */}
            <Card className="overflow-hidden border-2 shadow-md">
              <img
                src="/image.webp"
                className="w-full h-48 object-contain"
                alt="Imagen IA"
              />
            </Card>

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
              onConfigChange={setAiConfig}
              initialConfig={aiConfig}
            />
          </div>
        </div>
    </div>
  );
};


export default HomeStreamingChat;