import React from 'react';
import { useUserChats } from '../../hooks/useChatQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { MessageCircle, Calendar, Clock, Plus } from 'lucide-react';

interface ChatListProps {
  onChatSelect?: (chatId: number) => void;
  onNewChat?: () => void;
  selectedChatId?: number;
}

export const ChatList: React.FC<ChatListProps> = ({
  onChatSelect,
  onNewChat,
  selectedChatId
}) => {
  const { data: chats, isLoading, error } = useUserChats();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={20} />
            Mis Conversaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <MessageCircle size={20} />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            No se pudieron cargar las conversaciones
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) {
        return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      } else if (diffMins > 0) {
        return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
      } else {
        return 'hace un momento';
      }
    } catch {
      return 'Fecha no válida';
    }
  };

  const sortedChats = chats ? [...chats].sort((a, b) => {
    const dateA = new Date(a.LAST_ACTIVITY_AT || a.CREATED_AT);
    const dateB = new Date(b.LAST_ACTIVITY_AT || b.CREATED_AT);
    return dateB.getTime() - dateA.getTime();
  }) : [];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={20} />
            Mis Conversaciones
          </CardTitle>
          {onNewChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Nueva
            </Button>
          )}
        </div>
        {chats && (
          <Badge variant="secondary" className="w-fit">
            {chats.length} conversación{chats.length !== 1 ? 'es' : ''}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {!chats || chats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              No tienes conversaciones aún
            </p>
            {onNewChat && (
              <Button
                variant="outline"
                onClick={onNewChat}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Iniciar primera conversación
              </Button>
            )}
          </div>
        ) : (
          sortedChats.map((chat) => (
            <Card
              key={chat.CHAT_ID}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedChatId === chat.CHAT_ID
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onChatSelect?.(chat.CHAT_ID)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium truncate">
                        Conversación #{chat.CHAT_ID}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        Área {chat.AREA_ID}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          Creada {formatDate(chat.CREATED_AT)}
                        </span>
                      </div>
                      
                      {chat.LAST_ACTIVITY_AT && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>
                            Activa {formatDate(chat.LAST_ACTIVITY_AT)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedChatId === chat.CHAT_ID && (
                    <div className="ml-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ChatList;