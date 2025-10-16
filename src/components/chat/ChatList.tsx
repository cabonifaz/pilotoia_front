import React, { useState, useRef, useEffect } from 'react';
import { useUserChats } from '../../hooks/useChatQueries';
import { useCurrentUser } from '../../hooks/useUserQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { Input } from '../shadcn/input';
import { MessageCircle, Clock, Plus } from 'lucide-react';
import { ChatMenu } from './ChatMenu';
import { chatApi } from '../../api/chatApi';
import { useQueryClient } from '@tanstack/react-query';

interface ChatListProps {
  onChatSelect?: (chatId: number) => void;
  onNewChat?: () => void;
  selectedChatId?: number;
  isDisabled?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  onChatSelect,
  onNewChat,
  selectedChatId,
  isDisabled = false
}) => {
  const { data: allChats, isLoading, error } = useUserChats();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // State for inline editing
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter chats by actual company area
  const chats = React.useMemo(() => {
    if (!allChats || !user?.actual_company_area) return allChats || [];

    const { ID_AREA, ID_EMPRESA } = user.actual_company_area;

    return allChats.filter(chat =>
      chat.ID_AREA === ID_AREA && chat.ID_EMPRESA === ID_EMPRESA
    );
  }, [allChats, user?.actual_company_area]);

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

  // Sort chats by date
  const sortedChats = React.useMemo(() => {
    if (!chats) return [];

    return [...chats].sort((a, b) => {
      const dateA = new Date(a.ULTIMO_MENSAJE_FECHA || 0);
      const dateB = new Date(b.ULTIMO_MENSAJE_FECHA || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [chats]);

  // Handle new chat button click
  const handleNewChatClick = () => {
    if (!isDisabled) {
      onNewChat?.();
    }
  };

  // Handle chat selection
  const handleChatClick = (chatId: number) => {
    if (!isDisabled) {
      onChatSelect?.(chatId);
    }
  };

  // Handle chat deletion - clear selection if deleted chat was selected
  const handleChatDeleted = (chatId: number) => {
    if (selectedChatId === chatId) {
      onNewChat?.();
    }
  };

  // Handle entering edit mode
  const handleRenameStart = (chatId: number, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingChatId]);

  // Handle saving the title
  const handleRenameSubmit = async (originalTitle: string) => {
    if (!editingTitle.trim() || editingTitle.trim() === originalTitle) {
      // No changes, just exit edit mode
      setEditingChatId(null);
      return;
    }

    if (!editingChatId) return;

    setIsUpdating(true);
    try {
      const result = await chatApi.updateChatTitle(editingChatId, editingTitle.trim());

      if (result.ID_TIPO_MENSAJE === 2) {
        // Success - Update chat title directly in the cache
        queryClient.setQueryData<any[]>(
          ['user', 'chats'],
          (oldChats = []) => oldChats.map((chat: any) =>
            chat.ID_CHAT === editingChatId
              ? { ...chat, TITULO: editingTitle.trim() }
              : chat
          )
        );

        setEditingChatId(null);
      } else {
        // ID_TIPO_MENSAJE === 1 means failure - don't update cache, just show error
        alert(result.MENSAJE);
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      alert('Error al renombrar la conversación');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle click outside or blur
  const handleRenameBlur = (originalTitle: string) => {
    if (!isUpdating) {
      handleRenameSubmit(originalTitle);
    }
  };

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
              onClick={handleNewChatClick}
              disabled={isDisabled}
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
        {sortedChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              No hay conversaciones guardadas
            </p>
          </div>
        ) : (
          sortedChats.map((chat) => {
            const isSelected = selectedChatId === chat.ID_CHAT;
            const isEditing = editingChatId === chat.ID_CHAT;

            return (
              <Card
                key={chat.ID_CHAT}
                className={`transition-all ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-md'
                } ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : !isDisabled ? 'hover:bg-gray-50' : ''
                }`}
                onClick={() => !isEditing && handleChatClick(chat.ID_CHAT)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isEditing ? (
                          <Input
                            ref={inputRef}
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameBlur(chat.TITULO || '')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameSubmit(chat.TITULO || '');
                              } else if (e.key === 'Escape') {
                                setEditingChatId(null);
                              }
                            }}
                            maxLength={50}
                            disabled={isUpdating}
                            className="text-sm font-medium h-6 px-2 py-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h3 className="text-sm font-medium truncate">
                            {chat.TITULO || `Conversación #${chat.ID_CHAT}`}
                          </h3>
                        )}
                      </div>

                      {!isEditing && (
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
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && !isEditing && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}

                      {/* Menu button */}
                      {!isEditing && (
                        <ChatMenu
                          chatId={chat.ID_CHAT}
                          isDisabled={isDisabled}
                          onChatDeleted={handleChatDeleted}
                          onRenameClick={() => handleRenameStart(chat.ID_CHAT, chat.TITULO || '')}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ChatList;