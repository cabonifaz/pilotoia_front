import { Bot, Loader2 } from 'lucide-react';
import { Card, CardHeaderCompact, CardContentCompact } from '@/components/shadcn/card';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';

interface StreamingProgressProps {
  message: string;
}

export const StreamingProgress = ({ message }: StreamingProgressProps) => (
  <div className="mb-6 flex justify-start">
    <Card className="max-w-[80%] border-0 shadow-none bg-background">
      <CardHeaderCompact className="pb-2">
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">AI</span>
        </div>
      </CardHeaderCompact>
      <CardContentCompact>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{message}</span>
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      </CardContentCompact>
    </Card>
  </div>
);
