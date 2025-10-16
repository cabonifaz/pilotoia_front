import React, { useState } from 'react';
import { Button } from '../shadcn/button';
import { Input } from '../shadcn/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../shadcn/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../shadcn/dialog';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { useQueryClient } from '@tanstack/react-query';

interface ChatMenuProps {
  chatId: number;
  currentTitle: string;
  isDisabled?: boolean;
  onChatDeleted?: (chatId: number) => void;
}

export const ChatMenu: React.FC<ChatMenuProps> = ({
  chatId,
  currentTitle,
  isDisabled = false,
  onChatDeleted
}) => {
  const queryClient = useQueryClient();

  // State for rename dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle rename
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTitle(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!newTitle.trim()) return;

    setIsRenaming(true);
    try {
      const result = await chatApi.updateChatTitle(chatId, newTitle.trim());

      if (result.ID_TIPO_MENSAJE === 2) {
        // Success - Update chat title directly in the cache
        queryClient.setQueryData<any[]>(
          ['user', 'chats'],
          (oldChats = []) => oldChats.map((chat: any) =>
            chat.ID_CHAT === chatId
              ? { ...chat, TITULO: newTitle.trim() }
              : chat
          )
        );

        setRenameDialogOpen(false);
        setNewTitle('');
      } else {
        // ID_TIPO_MENSAJE === 1 means failure - don't update cache, just show error
        alert(result.MENSAJE);
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      alert('Error al renombrar la conversación');
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await chatApi.deleteChat(chatId);

      if (result.ID_TIPO_MENSAJE === 2) {
        // Success
        // 1. Remove messages for this chat from TanStack Query
        queryClient.removeQueries({
          queryKey: ['chat', 'messages', chatId],
          exact: true
        });

        // 2. Check if this is the currently selected chat
        const currentChatId = sessionStorage.getItem('current_chat_id');
        if (currentChatId && parseInt(currentChatId) === chatId) {
          // Clear session storage if it's the same chat
          sessionStorage.removeItem('current_chat_id');
        }

        // 3. Remove chat from the chats list in TanStack Query
        queryClient.setQueryData<any[]>(
          ['user', 'chats'],
          (oldChats = []) => oldChats.filter((chat: any) => chat.ID_CHAT !== chatId)
        );

        setDeleteDialogOpen(false);

        // 4. Notify parent component that chat was deleted (to reset state if needed)
        onChatDeleted?.(chatId);
      } else {
        // ID_TIPO_MENSAJE === 1 means failure - don't do anything, just show error
        alert(result.MENSAJE);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Error al eliminar la conversación');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Menu button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200"
            disabled={isDisabled}
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleRenameClick}
            className="cursor-pointer"
          >
            <Pencil size={14} className="mr-2" />
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 size={14} className="mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Renombrar Conversación</DialogTitle>
            <DialogDescription>
              Ingresa un nuevo nombre para la conversación
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nuevo título"
            maxLength={50}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              }
            }}
            disabled={isRenaming}
          />
          <p className="text-xs text-gray-500 mt-1">
            {newTitle.length}/50 caracteres
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={isRenaming || !newTitle.trim()}
            >
              {isRenaming ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Eliminar Conversación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatMenu;
