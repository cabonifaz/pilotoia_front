import React from 'react';
import { useUserChats } from '../../hooks/useChatQueries';
import { useCurrentUser } from '../../hooks/useUserQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { MessageCircle, Clock, Plus } from 'lucide-react';

interface ChatListProps {
  onChatSelect?: (chatId: number) => void;
  onNewChat?: () => void;
  selectedChatId?: number | null;
  currentChatId?: number | null;
}

export const ChatList: React.FC<ChatListProps> = ({
  onChatSelect,
  onNewChat,
  selectedChatId,
  currentChatId
}) => {
  const { data: allChats, isLoading, error } = useUserChats();
  const { user } = useCurrentUser();

  // Filter chats by actual company area
  const chats = React.useMemo(() => {
    if (!allChats || !user?.actual_company_area) return allChats || [];

    const { ID_AREA, ID_EMPRESA } = user.actual_company_area;

    return allChats.filter(chat =>
      chat.ID_AREA === ID_AREA && chat.ID_EMPRESA === ID_EMPRESA
    );
  }, [allChats, user?.actual_company_area]);

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
    const dateA = new Date(a.ULTIMO_MENSAJE_FECHA || 0);
    const dateB = new Date(b.ULTIMO_MENSAJE_FECHA || 0);
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
              disabled={currentChatId === null}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Nueva Conversación
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
            <p className="text-sm text-gray-500">
              No hay conversaciones guardadas
            </p>
          </div>
        ) : (
          sortedChats.map((chat) => (
            <Card
              key={chat.ID_CHAT}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedChatId === chat.ID_CHAT
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onChatSelect?.(chat.ID_CHAT)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium truncate">
                        {chat.TITULO || `Conversación #${chat.ID_CHAT}`}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {chat.ULTIMO_MENSAJE_FECHA && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>
                            Activa {formatDate(chat.ULTIMO_MENSAJE_FECHA)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedChatId === chat.ID_CHAT && (
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