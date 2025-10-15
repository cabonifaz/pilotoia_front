import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useUserQueries';
import type { ChatData } from '../types/auth';

// Hook to get user's chats list from TanStack Query cache
export const useUserChats = () => {
    const { user } = useCurrentUser();
    const queryClient = useQueryClient();

    // Match the query key structure from useUserChatsQuery
    const actualCompanyArea = (user as any)?.actual_company_area;
    const companyAreaKey = actualCompanyArea
        ? `${actualCompanyArea.ID_EMPRESA}-${actualCompanyArea.ID_AREA}`
        : null;

    return useQuery({
        queryKey: ['user', 'chats', companyAreaKey],
        queryFn: (): ChatData[] => {
            // Read from cache populated by useUserChatsQuery
            return queryClient.getQueryData(['user', 'chats', companyAreaKey]) || [];
        },
        enabled: !!user && !!companyAreaKey, // Only run if user is authenticated and has company area
        staleTime: Infinity, // Always fresh - data managed by useUserChatsQuery
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
    });
};

// Hook to get a specific chat by ID
export const useChatById = (chatId: number) => {
    const { data: chats } = useUserChats();
    
    return chats?.find(chat => chat.ID_CHAT === chatId) || null;
};

// Hook to manage chat list updates (for future use when implementing chat CRUD)
export const useChatListUpdater = () => {
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();

    // Match the query key structure from useUserChatsQuery
    const actualCompanyArea = (user as any)?.actual_company_area;
    const companyAreaKey = actualCompanyArea
        ? `${actualCompanyArea.ID_EMPRESA}-${actualCompanyArea.ID_AREA}`
        : null;

    const updateChatsList = (updater: (oldChats: ChatData[]) => ChatData[]) => {
        if (user && companyAreaKey) {
            queryClient.setQueryData(
                ['user', 'chats', companyAreaKey],
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
                chat.ID_CHAT === chatId 
                    ? { ...chat, ...updatedChat }
                    : chat
            )
        );
    };
    
    const removeChat = (chatId: number) => {
        updateChatsList((oldChats) => 
            oldChats.filter(chat => chat.ID_CHAT !== chatId)
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