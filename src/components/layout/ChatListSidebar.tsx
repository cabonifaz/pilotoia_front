import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { Input } from '../shadcn/input';
import { cn } from '@/lib/utils';
import { ChatMenu } from '../chat/ChatMenu';
import { chatApi } from '../../api/chatApi';
import { useUserChats } from '../../hooks/useChatQueries';
import { useCurrentUser } from '../../hooks/useUserQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useChatState } from '../../contexts/ChatStateContext';

interface ChatListSidebarProps {
  isStreaming?: boolean;
  isCollapsed?: boolean;
}

export const ChatListSidebar = ({ isStreaming = false, isCollapsed = false }: ChatListSidebarProps) => {
  const { data: allChats, isLoading, error } = useUserChats();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { selectedChatId, onChatSelect, onNewChat } = useChatState();

  // State for inline editing
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // State to track mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's `md` breakpoint
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Filter chats by actual company area
  const chats = React.useMemo(() => {
    if (!allChats || !user?.actual_company_area) return allChats || [];

    const { ID_AREA, ID_EMPRESA } = user.actual_company_area;

    return allChats.filter(chat =>
      chat.ID_AREA === ID_AREA && chat.ID_EMPRESA === ID_EMPRESA
    );
  }, [allChats, user?.actual_company_area]);

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
    if (!isStreaming) {
      onNewChat();
    }
  };

  // Handle chat selection
  const handleChatClick = (chatId: number) => {
    if (!isStreaming && !editingChatId) {
      onChatSelect(chatId);
    }
  };

  // Handle chat deletion
  const handleChatDeleted = (chatId: number) => {
    if (selectedChatId === chatId) {
      onNewChat();
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
      setEditingChatId(null);
      return;
    }

    if (!editingChatId) return;

    setIsUpdating(true);
    try {
      const result = await chatApi.updateChatTitle(editingChatId, editingTitle.trim());

      if (result.ID_TIPO_MENSAJE === 2) {
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

  if (isCollapsed && !isMobile) {
    return null;
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-1">
      {isLoading ? (
        <div className="space-y-0.5 px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <MessageCircle size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-500">
            No se pudieron cargar las conversaciones
          </p>
        </div>
      ) : (
        <>
          <div className="px-2 h-8 flex items-center mt-1">
            <h3 className="font-semibold text-xs px-1">Conversaciones</h3>
          </div>

          <Button
            variant="ghost"
            onClick={handleNewChatClick}
            disabled={isStreaming}
            className="w-full h-8 justify-start gap-2 px-2 transition-all duration-300"
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs">Nueva Conversación</span>
          </Button>

          {chats && chats.length > 0 && (
            <Badge variant="secondary" className="w-fit text-xs mx-2">
              {chats.length} conversación{chats.length !== 1 ? 'es' : ''}
            </Badge>
          )}

          <div className="flex-1 space-y-0.5 overflow-y-auto min-h-0 px-1.5 mt-1">
            {sortedChats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">
                  No hay conversaciones
                </p>
              </div>
            ) : (
              sortedChats.map((chat) => {
                const isSelected = selectedChatId === chat.ID_CHAT;
                const isEditing = editingChatId === chat.ID_CHAT;

                return (
                  <div key={chat.ID_CHAT} className="relative group">
                    <Button
                      variant={isSelected ? 'secondary' : 'ghost'}
                      className={cn(
                        "transition-all duration-300 h-8 w-full justify-start gap-2 px-2",
                        isStreaming && "opacity-50"
                      )}
                      onClick={() => !isEditing && handleChatClick(chat.ID_CHAT)}
                      disabled={isStreaming || isEditing}
                    >
                      <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
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
                          className="h-6 px-1 py-0 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate text-xs">
                          {chat.TITULO || `Conversación #${chat.ID_CHAT}`}
                        </span>
                      )}
                    </Button>

                    {!isEditing && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChatMenu
                          chatId={chat.ID_CHAT}
                          isDisabled={isStreaming}
                          isSelected={isSelected}
                          onChatDeleted={handleChatDeleted}
                          onRenameClick={() => handleRenameStart(chat.ID_CHAT, chat.TITULO || '')}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
