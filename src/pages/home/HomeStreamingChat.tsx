import { useState } from 'react';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import ChatComponent from '../../components/chat/ChatComponent';
import AIConfigPanel from '../../components/aiConfigPanel/AIConfigPanel';

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
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    user_id: 'user123',
    company_id: 'CIA00001',
    area: '',
    similarity_threshold: 0.4,
    temperature: 0.3,
    max_tokens: 1024,
    top_k: 5,
  });


  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-start px-4 py-2 bg-background border-b">
        <img
          src="/fractal-logo.svg"
          className="h-10 w-auto"
          alt="Logo Fractal"
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-8 p-8">
          {/* Chat Section - 70% width */}
          <div className="flex-1 lg:w-[70%]">
            <ChatComponent aiConfig={aiConfig} />
          </div>

          {/* Right Sidebar - 30% width */}
          <div className="lg:w-[30%] flex-shrink-0 space-y-4 overflow-y-auto">
            {/* AI Image */}
            <Card className="overflow-hidden border-2 shadow-md">
              <img
                src="https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/reportajes/las-mentiras-visuales-de-la-ia/11896126-1-esl-MX/Las-mentiras-visuales-de-la-IA.jpg"
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