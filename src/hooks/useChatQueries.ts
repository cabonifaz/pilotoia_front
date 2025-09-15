import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { useCurrentUser } from './useUserQueries';
import type { ChatData } from '../api/authApi';

// Hook to get user's chats list from TanStack Query cache
export const useUserChats = () => {
    const { user } = useCurrentUser();
    
    return useQuery({
        queryKey: queryKeys.chat.list(user?.user_id || 0),
        queryFn: (): ChatData[] => {
            // Return empty array if no user - the data should come from login response
            return [];
        },
        enabled: !!user?.user_id, // Only run if user is authenticated
        staleTime: 8 * 60 * 60 * 1000, // Consider fresh for 8 hours (match JWT expiration)
        gcTime: 8 * 60 * 60 * 1000, // Keep in cache for 8 hours
        refetchOnWindowFocus: false, // Don't refetch on focus (data comes from login)
        refetchOnReconnect: false, // Don't refetch on reconnect
        retry: false, // Don't retry - data should be set during login
    });
};

// Hook to get a specific chat by ID
export const useChatById = (chatId: number) => {
    const { data: chats } = useUserChats();
    
    return chats?.find(chat => chat.CHAT_ID === chatId) || null;
};

// Hook to manage chat list updates (for future use when implementing chat CRUD)
export const useChatListUpdater = () => {
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();
    
    const updateChatsList = (updater: (oldChats: ChatData[]) => ChatData[]) => {
        if (user?.user_id) {
            queryClient.setQueryData(
                queryKeys.chat.list(user.user_id),
                (oldData: ChatData[] | undefined) => {
                    return updater(oldData || []);
                }
            );
        }
    };
    
    const addChat = (newChat: ChatData) => {
        updateChatsList((oldChats) => [newChat, ...oldChats]);
    };
    
    const updateChat = (chatId: number, updatedChat: Partial<ChatData>) => {
        updateChatsList((oldChats) => 
            oldChats.map(chat => 
                chat.CHAT_ID === chatId 
                    ? { ...chat, ...updatedChat }
                    : chat
            )
        );
    };
    
    const removeChat = (chatId: number) => {
        updateChatsList((oldChats) => 
            oldChats.filter(chat => chat.CHAT_ID !== chatId)
        );
    };
    
    return {
        addChat,
        updateChat,
        removeChat,
        updateChatsList
    };
};

// Hook to clear chat cache (useful for logout)
export const useClearChatCache = () => {
    const queryClient = useQueryClient();
    
    return () => {
        queryClient.removeQueries({ queryKey: ['chat'] });
    };
};